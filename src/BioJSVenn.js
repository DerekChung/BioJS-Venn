require('d3');

var sets = require('simplesets')

var VennPrototype = {


	autoLayout: true,

/**
* Save the Venn diagram into PNG.
*/
	saveAsPNG: function(){
		var canvas = d3.select( "body" )
						.append( "canvas" )
						.attr( "width", w )
						.attr( "height", h )
						.style( "display", "none" )
		//get the html from svg element
		var html = svg.attr("version", 1.1)
					.attr("xmlns", "http://www.w3.org/2000/svg")
					.node().parentNode.innerHTML;

		var context = canvas.node().getContext("2d");
		var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);

		var image = new Image;
		image.src = imgsrc;

		var IntersectionSet = this._getIntersectSets();

		image.onload = function () {
			context.drawImage( image, 0, 0 );

			//try to add back text into the graph as changing from svg to canvas lose all <text> element.
			var textPosition = [];
			for ( key in IntersectionSet ){
				var text = d3.select( "#text" + key )

				if ( text.node() )
					textPosition.push( { x: text.attr( "x" ), y: text.attr( "y" ), text: IntersectionSet[key].list.size() } );
			}

			if ( textPosition.length > 0 ){
				context.font = "15px Open San";
				for ( i = 0; i < textPosition.length; i++ ){
					var obj = textPosition[i];
					context.fillText(obj.text, obj.x, obj.y);
				}
			}

			//add back the title
			textPosition = [];
			for ( var i = 1; i <= 7; i++ ) {
				var text = d3.select( "#titleText" + i )
				if ( text.node() )
					textPosition.push( { x: text.attr( "x" ), y: text.attr( "y" ), text: nameList[ i - 1 ] } );
			}

			if ( textPosition.length > 0 ){
				context.font = "15px Open San";
				for ( i = 0; i < textPosition.length; i++ ){
					context.fillStyle = predefineColor[ i + 1 ];
					var obj = textPosition[i];
					context.fillText(obj.text, obj.x, obj.y);
				}
			}

			var canvasdata = canvas.node().toDataURL("image/png");

			var pngimg = '<img src="'+canvasdata+'">'; 

			//append <a> element on the html
			var a = document.createElement("a");
			a.id = "for-download-png"
			a.download = "Venn.png";
			a.href = canvasdata;
			a.click();

			//remove the <a>
			d3.select( "#for-download-png" ).remove()
			canvas.remove();
		}
	},
/**
 * Save last required Set if there is any. User can make requirement 
 * by clicking on the Venn digram or via provide function getRequiredList()
 */
	saveLastRequireSets: function () {

		var key = this._getlastRequireSet();

		var intersect = this._getIntersectSets();
		var combination = intersect[ key ].combination;
		var listName = this._getIntersectSetsName(combination);
		var textToWrite = listName + ":\n" + intersect[ key ].list.array().join( "\n" );
		
		this._savefile( listName,  textToWrite )

	},

/**
 * Save all set including all sets and their intersect combination.
 */
	saveAllSets: function () {
		var intersect = this._getIntersectSets();
		var textToWrite = "";
		var combination, listName;

		for ( key in intersect ) {
			combination = intersect[ key ].combination;
			listName = this._getIntersectSetsName(combination);
			textToWrite += listName + ":\n" + intersect[ key ].list.array().join( "\n" );
			textToWrite += "\n\n"
		}
		
		this._savefile( "All Lists",  textToWrite )

	},
/**
 * Custom click callback function for Venn diagram. In the other words, 
 * define behavior after clicking on the Venn diagram. This function 
 * will receive an object after clikcing on a specific set in the Venn diagram. 
 * This is the structure of the object: { title, list, combination }. 
 * "title" (String) is the name of the set, "list" (Array) contain all elements
 * of the set, "combination" (Array) is component index of the set.
 * For example, if user click on "A intersect B" area, where A is List 1 and B is List 2
 * Then title is "A intersect B"
 * "list" contain all elements of "A intersect B"
 * combination is an array contain two element: [ 1, 2 ]
 * @param {Function} callback click callback function
 */
	setClickCallback: function ( callback ){
		this._setclickChartCallback( callback );
	},

/**
* Number of sets in the Venn diagram right now
* @return {Integer} the number of sets in the Venn diagram
*/
	getNumberOfSets: function () {
		return this._listSets.length;
	},

/**
* Get the upper limit number of sets
* @return {Integer} upper limit of sets
*/
	getMaxVennSets: function () {
		return this._N;
	},

/**
* Switch to Automatic Venn diagram Layout.
* When there are more than 5 sets,
* the automatic layout will generate Euler diagram instead.
*/
	switchToAutoMode: function () {
		this.autoLayout = true;
		this._updateGraph();
	},

/**
* Switch to predefined Venn diagram Layout.
* When there are more than 6 sets,
* the predefined layout will generate Euler diagram instead.
*/
	switchToPredfinedMode: function () {
		this.autoLayout = false;
		this._updateGraph();
	},

/**
* Update the title of specific set.
* Remind that the index should start from 1 instead of 0
* For example, if you want to set the first set name "movies",
* then you should index = 1, name = "movies"
* @param {Number} index the set need to be modified name 
* @param {String} name new name for the set
*/
	updateListName: function ( index, name ){

		if ( this._listSets[index] )
			this._updateName( index, name );

	},

/**
* Get a specific set. If user want to get Set 1, Set 2, and Set 3 interect,
* input an Array = [ 1, 2, 3 ]. If user only want Set 2, then input an Array
* only contain one element [ 2 ].
* This function return an object { title, list }:
* "title" is the name of the required set
* "list" contains all the element of the required set.
* Please remain that title is the name of the set.
* If user require Set 1 and Set 2 intersect where Set 1 names "A" and Set 2 names "B",
* then "title" is " A intersect B ".
* @param {Array} requireList a list of required set index
* @return {Object} return object contain two elements, "title" name of the required set,and "list" elements of the set. 
*/
	getRequiredList: function( requireList ){
		
		if ( requireList instanceof Array ) {
			if ( requireList.length != 0 && requireList.length <= 7 ) {

				requireList.sort();
				var requireKey = requireList[0];

				for ( i = 1; i < requireList.length; i++ ){
					//generate 1in2in......
					requireKey += "in" + requireList[i];
				}

				var intersectSets = this._getIntersectSets()

				if ( intersectSets ){
					if ( intersectSets[requireKey] ) {
						this._updatelastRequireSet( requireKey );
						var name = this._getIntersectSetsName( intersectSets[requireKey].combination )
						return  { title: name, list: intersectSets[requireKey].list.array()};
					}
				}
			}
		}

	},

/**
* Get a specific set by name. If user want to get 
* Set 1(name: "A"), Set 2(name: "B"), and Set 3(name: "C") interect,
* input an Array = [ "A", "B", "C" ]. If user only want Set 2(name: B), then input an Array
* only contain one element [ "B" ].
* This function return an object { title, list }:
* "title" is the name of the required set
* "list" contains all the element of the required set.
* Please remain that title is the name of the set.
* @param {Array} requireList a list of required set name
* @return {Object} return object contain two elements, "title" name of the required set,and "list" elements of the set. 
*/
	getRequiredListByName: function( requireList ){

		if ( requireList instanceof Array ) {
			if ( requireList.length != 0 && requireList.length <= 7 ) {

				var requirement = [];

				for ( i = 0; i < requireList.length; i++ )
					for ( j = 0; j < this._listSets.length; j++ )
						if ( this._listSets[j].name == requireList[i] )
							requirement.push( j );

				if ( requirement.length > 0 )
					return getRequiredList( requirement );
			}
		}

	},

/**
* Get all sets including their combinations.
* This function return an array of object { title, list }:
* "title" is the name of set.
* "list" contains all the element of set.
* Please remain that title is the name of the set.
* @return {Array} array of objects which contain title (set name) and element
*/
	getAllIntersectSets: function(){
		var ans = [];
		var intersectList = this._getIntersectSets();

		for ( key in intersectList ) {
			var combination = intersectList[key].combination;
			var name = this._getIntersectSetsName( combination )

			ans.push( { title: name, intersectList: intersectList[key].list.array() } )
		}

		return ans;
	},

/**
* Update the whole set.
* This function provide an interface to update Set content.
* If user want to update List 1 name to "A", and element = [ "Monday", "Tuesday" ],
* then index = 1, name = "A", list = [ "Monday", "Tuesday" ].
* If user only want to update the set content, then name = null.
* Remind that parameter list will completely replace the exist content in the set.
* @param {Number} index index of the set need to be modified
* @param {String} name new name for the set. If null, keep the name
* @param {Array} list a list of element replaced the desired set
*/
	updateList: function ( index, name, list ){

		if ( this._listSets[index] ) {
			
			if ( list.length == 1 && list[0] == ""  )
				this._listSets[index].list = new sets.Set();
			else
				this._listSets[index].list = new sets.Set( list );

			if ( name )
				this._updateName( index, name );

			if ( list.length == 0 || (list.length == 1 && list[0] == "" ) ) {
				if ( index + 1 == this._listSets.length ) {

					for ( var i = index; i >= 0; i-- ){
						if ( this._listSets[i].list.size() == 0 || (this._listSets[i].list.size() == 1 && this._listSets[i].list.array()[0] == "" ) )
							this._listSets.pop();
						else
							break;
					}
					var ans = this._generateAllIntersectSets( );
					
					this._updateIntersectSets( ans );
					this._updateGraph();
					return true;
				}
			}

			//TODO: find a faster way to update existing list.
			var ans = this._generateAllIntersectSets( );
			
			this._updateIntersectSets( ans );
			this._updateText();

			return true;
		}

		return false;
	},

/**
* add one more set to the Venn diagram if possible.
* If the the Venn diagram is already full, then nothing happen.
* @param {String} name name of the new set
* @param {Array} list list of element of the new set
*/
	addList: function ( name, list ) {
		if ( this._listSets.length  == this._N )
			return;

		if ( list.length == 1 && list[0] == "" )
			this._listSets.push( { name: name, list: new sets.Set() } );
		else
			this._listSets.push( { name: name, list: new sets.Set( list ) } );
		
		this._updateName( this._listSets.length - 1, name )
		var ans = this._generateAllIntersectSets();
		
		this._updateIntersectSets( ans );
		this._updateGraph();

	},

/**
* parse and JSON to sets.
* Here is the structure of input:
* "{ "A": [ 1, 2, 3, 4 ], 
*   "B": [ 2, 3, 4, 7 ] }"
* key will be the name of the set
* @param {String} input json text contain all the sets and corresponding name
*/
	readJSON: function( text ) {
		
		try {
			var data = JSON.parse(text);

			this.updateAllList( data );
	    }
	    catch ( e ){
	    	alert( "Wrong JSON format." );
	    }
	},

/**
* Replace all list with the given data
* Here is the structure of input:
* { "A": [ 1, 2, 3, 4 ], 
*   "B": [ 2, 3, 4, 7 ] }
* key will be the name of the set.
* Compare to readJSON(), this function accept object.
* @param {Object} data an input object contain all the sets and coreponding name
*/
	updateAllList: function ( data ) {
		
		this._listSets = [];
		
		var ans = {};
		var counter = 0;

		for ( key in data ) {
			if ( counter == this._N ) {
				break;
			}
			this._listSets[ counter ] = {  name: key , list: new sets.Set(data[key])};
			this._updateName( counter, key );
			counter++;
		}

		ans = this._generateAllIntersectSets( );
		
		this._updateIntersectSets( ans );
		this._updateGraph();

	}
}

exports.BioJSVenn = function( target, lists, clickCallback ) {

	if ( !target )
		return;

	var generateCombination = function ( start, end ){
		var ans = [];

		for ( var i = end; i >= start; i-- ){
			var result = [];
			result.push( [ i ] );

			for ( var j = 0; j < ans.length; j++ )
				for ( var k = 0; k < ans[j].length; k++ )
					result.push( ans[j][k].concat( [i] ) );

			ans.push( result );
		}

		return ans;
	}

	var mouseClickCall = function ( id ) {


		var combination = IntersectionSet[ id ].combination;
		var text = "";
		var arr = [];

		text = getNameByCombination( combination );

		lastRequireSet = id;

		if ( IntersectionSet[ id ] )
			if ( IntersectionSet[ id ].list.size() > 0 )
				arr =	IntersectionSet[ id ].list.array() ;

		if ( clickChartCallback && clickChartCallback instanceof Function )
			clickChartCallback( { title: text, list: arr, combination: combination  } )
	}

	//call this when mouse over event is triggered
	var mouseOverCall = function ( target, id ){

		d3.select(target).transition()
			.style( "fill-opacity",  function() {
				if ( typeof id == 'string' || id instanceof String)
					return 0.55;
				else 
					return selectedShapeFillOpacity;
				}
			)
			.style( "stroke-opacity", 0 );

		var combination = IntersectionSet[ id ].combination;

		d3.select( "#text" + id ).transition()
			.style( "fill", "white" );

		if ( typeof id == 'string' || id instanceof String) {

			var selectedSet = IntersectionSet[ id ].list;
			var intersectSetSize = selectedSet.size();

			if ( intersectSetSize != 0 ) {

				for ( i = 0; i < combination.length; i++ ){
					var targetSize = IntersectionSet[ combination[i].toString() ].list.size()

					var ratio = intersectSetSize / targetSize;

					d3.select( "#shape" + combination[i] ).transition()
						.style( "fill-opacity",  function() {

							var temp = (selectedShapeFillOpacity - unselectedShapeFillOpacity) * ratio;

							return unselectedShapeFillOpacity + temp;
						} )
				}
			}
		}

		//Update the tooltip position and value
		d3.select("#vennToolTip").transition()
		.style("left", (d3.event.pageX - 250) + "px")
		.style("top", (d3.event.pageY - 5) + "px")
		.style("position", "absolute")
		.style("opacity", 0.6 )
		.style("z-index", 9)

		d3.select("#vennToolTipTitle")
			.text( function (d) { 

			return getNameByCombination( combination ) + ":";
		});

		d3.select( "#vennToolTipListSize" )
			.text( " size = " + IntersectionSet[ id ].list.size() )

		d3.select( "#vennToolTipList" )
			.text( function (d) {
				var text = "";

				if ( IntersectionSet[ id ] )
					text += IntersectionSet[ id ].list.array().join(" | ");
				
				return text;
			} );
	};

//Get set nambe by a list of combination/
//For example, if List 1 intersect List 2 name is needed,
//then combination = [ 1, 2 ]
//@param {Array} combination Array of set index
//@return {String} nume of the required set
	var getNameByCombination = function( combination ) {
		var text =  nameList[ combination[0] - 1 ];

		for ( i = 1; i < combination.length; i++ ){
			
			if ( text != "" )
				text += " in " + nameList[ combination[i] - 1 ];
			else
				text += nameList[ combination[i] - 1 ];
		}

		return text;
	}

	//call this when mouse out event is triggered
	var mouseOutCall = function (target, id) {
		d3.select(target).transition()
			.style("fill-opacity", function () {
				if ( typeof id == 'string' || id instanceof String)
					return 0;
		 		else 
		 			return unselectedShapeFillOpacity;
		  	})
		 	.style("stroke-opacity", unselectedStrokeFillOpacity );
       
		var combination = IntersectionSet[ id ].combination;

		d3.select( "#text" + id ).transition()
			.style( "fill", "black" );

		if ( typeof id == 'string' || id instanceof String) {

			var selectedSet = IntersectionSet[ id ].list;
			var intersectSetSize = selectedSet.size();

			if ( intersectSetSize != 0 ) {

				for ( i = 0; i < combination.length; i++ ){
					d3.select( "#shape" + combination[i] ).transition()
						.style( "fill-opacity", unselectedShapeFillOpacity )
						.attr( "x", -1 );
				}
			}
		}

       //Hide the tooltip
		d3.select("#vennToolTip").transition().style("opacity", 0 ); 
	};

	var mouseMoveCall = function (traget) {
		d3.select("#vennToolTip")
			.style("left", (d3.event.pageX - 250) + "px")
			.style("top", (d3.event.pageY - 5) + "px")	
	};

	var drawEllipse = function ( jsonData ){

		if ( jsonData.length == 0 )
			return;

		var targetTransform = jsonData.length - 1;

		var transformGroup = svg.append("g")
								.attr( "transform", "scale(" + transform[ targetTransform ].scale + ") "
											+ "translate(" + transform[ targetTransform ].x + ", "
											+ transform[ targetTransform ].y + ")" )

		addWhiteBackground( transformGroup );

		var defs = transformGroup.append( "defs" )
								.selectAll("_")
								.data(jsonData)
								.enter()
								.append("g");

		//use for clipping later.
		defs.append( "clipPath" )
			.attr( "id", function (d) { return "clip" + d.id } )
			.append( "ellipse" )
			.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
			.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
			.attr("rx", function (d) { return d.rx} ).attr("ry", function (d) { return d.ry } );

		// This part is used to create a fake Stroke for the clipping. However, this part is not longer used.
		//defs.append( "clipPath" )
		//	.attr( "id", function (d) { return "clipL" + d.id } )
		//	.append( "ellipse" )
		//	.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
		//	.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
		//	.attr("rx", function (d) { return d.rx + StrokeWidth} ).attr("ry", function (d) { return d.ry + StrokeWidth} );
		//
		var shapeGroup = transformGroup.selectAll("_")
									.data(jsonData)
									.enter()
									.append( "g" );

		shapeGroup.append( "ellipse" )
				.attr( "id", function (d) { return "shape" + d.id } )
				.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
				.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
				.attr("rx", function (d) { return d.rx} ).attr("ry", function (d) { return d.ry } )
				.style("fill", function(d) { return predefineColor[d.id] })
				.style("fill-opacity", unselectedShapeFillOpacity )
				.style("stroke-opacity", unselectedStrokeFillOpacity )
				.style("stroke", predefineStrokeColor )
				.style("stroke-width", StrokeWidth )
				.on("mouseover", function (d) { mouseOverCall(this, d.id); })
				.on("mouseout", function (d)  { mouseOutCall(this, d.id); })
				.on("mousemove", function (d) { mouseMoveCall(this); })
				.on("click", function (d) { mouseClickCall( d.id ) } );

		shapeGroup.append( "text" )
				.attr( "id", function (d) { return "text" + d.id } )
				.text( function (d){
					if ( !IntersectionSet[ d.id.toString() ] )
						return 0;
					else
						return IntersectionSet[ d.id.toString() ].list.size() 
				} )
				.attr("x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY });

		//combinationList -> 	4
		//					3 4,3
		//					2 4,2 3,2 4,3,2
		//					1 4,1 4,3,1 2,1 4,2,1  
		//

		drawClip( combinationList, transformGroup );

		if ( jsonData.length > 1 )
			putPredefinedTextLabel( jsonData.length, transformGroup )
		    
	};

	var drawPath = function ( jsonData ){

		if ( jsonData.length == 0 )
			return;

		//  How to seperate Polygon and intersect?
		//	Take a look at the predefine JSON data at the very begining.
		//	For interesct area, the id is String. (e.g. "1_2")
		//
		//Here is how to check is the data for intersect or for shape.
		//if ( typeof jsonData[1].id == 'string' || jsonData.id instanceof String) {
		//
		//}

		var targetTransform = jsonData.length - 1;

		var transformGroup = svg.append("g")
								.attr( "transform", "scale(" + transform[ targetTransform ].scale + ") "
											+ "translate(" + transform[ targetTransform ].x + ", "
											+ transform[ targetTransform ].y + ")" )

		addWhiteBackground( transformGroup );

		var defs = transformGroup.append( "defs" )
								.selectAll("_")
								.data(jsonData)
								.enter()
								.append("g");

		defs.append( "clipPath" )
			.attr( "id", function (d) { return "clip" + d.id } )
			.append("path")
			.attr( "d", function (d){ return d.d } )

		var shapeGroup = transformGroup.selectAll("_")
									.data(jsonData)
									.enter()
									.append( "g" );


		shapeGroup.attr( "id", function (d) { return "shape" + d.id } )
				.append("path")
				.attr( "id", function (d){ return d.id } )
				.attr( "d", function (d){ return d.d } )
				.attr( "fill", function (d) { return predefineColor[d.id]; } )
				.style("fill-opacity", function (d) { return unselectedShapeFillOpacity; } )
				.style("stroke-opacity", unselectedStrokeFillOpacity )
				.style("stroke", function (d) { return predefineStrokeColor; } )
				.style("stroke-width", StrokeWidth )
				.on("mouseover", function (d) {  mouseOverCall(this, d.id); })
				.on("mouseout", function (d) {  mouseOutCall(this, d.id); })
				.on("mousemove", function (d) { mouseMoveCall(this); })
				.on("click", function (d) { mouseClickCall( d.id ) } );

		shapeGroup.append( "text" )
			.attr( "id", function (d){ return "text" + d.id } )
			.text( function (d){
				if ( !IntersectionSet[ d.id.toString() ] )
					return 0;
				else
					return IntersectionSet[ d.id.toString() ].list.size() } )
			.attr("x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY });

		drawClip( combinationList, transformGroup );

		if ( jsonData.length > 1 )
			putPredefinedTextLabel( jsonData.length, transformGroup )

	};

//Put predefined text label on the graph.
//This method called by drawEplise() and drawPath()
//@param {Number} numberOfSets number of sets have be drawn
//@param {Object} drawSVG on which svg object should put text label
	var putPredefinedTextLabel = function( numberOfSets, drawSVG ){
		drawSVG.selectAll("_")
				.data( predefineIntersectText[numberOfSets] )
				.enter()
				.append( "g" )
				.append( "text" )
				.attr( "id", function (d) { return "text" + d.id } )
				.attr( "x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY })
				.text( function (d){
					if ( !IntersectionSet[ d.id.toString() ] )
						return 0;
					else
						return IntersectionSet[ d.id.toString() ].list.size() } );
	}

//automatically generated the Venn digram
//@param {Number} num number of set want to be generated
	var drawVenn = function (num) {

		var toRadian = function ( degree ) {
			return degree * Math.PI / 180;
		}

		var rotateAngle = 360 / num;

		var x = 300, y = 320;
		var rx = 200, ry = 110;
		var startAngle = rotateAngle;

		var magnitudeA = 55;
		var magnitudeB = 18;

		var directionA = startAngle + 180;			//in degree
		var directionB = rotateAngle;	//in degree
		
		var nextX = x, nextY = y;

		var graphData = [], textData = [], titleData = [];

		for ( var i = 0; i < num; i++ ){
			nextX += magnitudeA * Math.cos( toRadian(directionA + rotateAngle * i) )
			nextY += magnitudeA * Math.sin( toRadian(directionA + rotateAngle * i) )
			
			var toBDirection = toRadian(directionB + rotateAngle * i);
			graphData.push( { id: i + 1, rotate: startAngle + rotateAngle * i, rx: rx, ry: ry,
							cx: nextX + magnitudeB * Math.cos( toBDirection ),
							cy: nextY + magnitudeB * Math.sin( toBDirection ) } )
			textData.push( { id: i + 1, 
							x: nextX - ( magnitudeB + rx * 0.71 ) * Math.cos( toBDirection ),
							y: nextY - ( magnitudeB + rx * 0.71 ) * Math.sin( toBDirection ) } )
			titleData.push( { id: i + 1, 
							x: nextX - ( magnitudeB + rx ) * Math.cos( toBDirection ),
							y: nextY - ( magnitudeB + rx ) * Math.sin( toBDirection ) } )			
			nextX += magnitudeB * Math.cos( toBDirection )
			nextY += magnitudeB * Math.sin( toBDirection )
		}

		var transformGroup = svg.append("g")
								.attr( "transform", "scale(" + transform[num - 1].scale + ") "
										+ "translate(" + transform[num - 1].x + ", "
										+ transform[num - 1].y + ")" )

		addWhiteBackground( transformGroup );

		var defs = transformGroup.append( "defs" )
								.selectAll("_")
								.data(graphData)
								.enter()
								.append("g");

		defs.append( "clipPath" )
			.attr( "id", function (d) { return "clip" + d.id } )
			.append( "ellipse" )
			.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
			.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
			.attr("rx", function (d) { return d.rx} ).attr("ry", function (d) { return d.ry } );


		var shapeGroup = transformGroup.selectAll("_")
									.data(graphData)
									.enter()
									.append( "g" );

		shapeGroup.append( "ellipse" )
			.attr( "id", function (d) { return "shape" + d.id } )
			.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
			.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
			.attr("rx", function (d) { return d.rx} ).attr("ry", function (d) { return d.ry } )
			.style("fill", function (d) { return predefineColor[d.id] })
			.style("fill-opacity", unselectedShapeFillOpacity )
			.style("stroke-opacity", unselectedStrokeFillOpacity )
			.style("stroke", predefineStrokeColor )
			.style("stroke-width", StrokeWidth )
			.on("mouseover", function (d) { mouseOverCall(this, d.id); })
			.on("mouseout", function (d)  { mouseOutCall(this, d.id); })
			.on("mousemove", function (d) { mouseMoveCall(this); })
			.on("click", function (d) { mouseClickCall( d.id ) } );

		drawClip( combinationList, transformGroup );

		
		var textGroup = transformGroup.selectAll("_")
									.data(textData)
									.enter()
									.append( "g" );

		textGroup.append( "text" )
				.attr( "id", function (d) { return "text" + d.id } )
				.attr( "x", function (d) { return d.x } ).attr( "y", function (d) { return d.y } )
				.text( function (d) {
					if ( !IntersectionSet[ d.id.toString() ] )
						return 0;
					else
						return IntersectionSet[ d.id.toString() ].list.size() 
				} )
		
		var titleGroup = transformGroup.selectAll("_")
								.data(titleData)
								.enter()
								.append( "g" );

		titleGroup.append( "text" )
				.attr( "id", function (d) { return "titleText" + d.id } )
				.attr( "x", function (d) { return d.x } ).attr( "y", function (d) { return d.y } )
				.style( "fill", function (d) { return predefineColor[ d.id ] } )
				.text( function (d) {
					return nameList[d.id - 1];
				} );

		/*text lable for the size of intersect of all lists.*/
		if ( num >= 2 ) {
			var allIntersectText = "1"
			/*generate 1in2in......*/
			for ( i = 2; i <= num; i++ )
				allIntersectText += "in" + i
			
			transformGroup.append( "text" )
				.attr( "id", "text" + allIntersectText )
				.attr( "x", x ).attr( "y", y - magnitudeB )
				.text( function () {
					if ( !IntersectionSet[ allIntersectText ] )
						return 0;
					else
						return IntersectionSet[ allIntersectText ].list.size();
				} )
		}
	}

	var drawClip = function ( combination, drawOn ) {

		var clip = function ( reuseID, group, clipID, i, j ){

			for ( var k = 0; k < combination[i][j].length; k++ ){
				group = group.append( "g" )
							.attr( "clip-path", "url(#" + reuseID + combination[i][j][k] + ")" );
			}

			return group.append( "rect" )
						.attr( "id", clipID )
						.attr( "width", w ).attr( "height", h )
						.attr( "x", 0 ).attr( "y", 0 )
		}

		for ( var i = 0; i < combination.length; i++ ) {

			for ( var j = 0; j < combination[i].length; j++  ){
				if ( combination[i][j].length == 1 )
					continue;

				var targetID = combination[i][j].join("in");

				var group = drawOn.append( "g" )
								.attr( "id", "g" + targetID )
								.style( "fill-opacity", 0 );

				//clip( "clipL", group, "L" + targetID ).style( "fill", "white" );
				
				clip( "clip", group, targetID, i, j ).on("mouseover", function () { mouseOverCall( "#g" + this.id , this.id ) } ) 
								.on("mouseout", function () {  mouseOutCall("#g" + this.id, this.id); })
								.on("mousemove", function () { mouseMoveCall(this); })
								.on("click", function () { mouseClickCall( this.id ) } );
			}
		}
	}

	var addWhiteBackground = function ( drawOn ) {
		drawOn.append( "rect" )
			.attr( "fill", "white" )
			.attr("width", w).attr("height", h)
			.attr( "x", 0 ).attr( "y", 0 );

	}

//redraw the whole graph immediately
	this._updateGraph = function () {

		svg.select("*").remove();

		if ( this._listSets.length == 0 )
			return;

		if ( this.autoLayout ){
			drawVenn( this._listSets.length );
		}
		else{
			if ( this._listSets.length != 6 ) 
				drawEllipse( predefineShape[ this._listSets.length ] );
			else
				drawPath( predefineShape[ this._listSets.length ] );
		}
	};

//comput all intersection set base on the sets provided by user
//@return {object} all intersection set
	this._generateAllIntersectSets = function ( ){

		var ans = {};

		for ( var i = this._listSets.length - 1; i >= 0; i-- ) {
			var result = {};

			if ( this._listSets[i] )
				result[ (i + 1).toString() ] = this._listSets[i].list;
			

			for ( var key in ans ){
				if ( this._listSets[ i ] ) 
					result[ ( i +1 ).toString() + "in" + key] = ans[key].intersection( this._listSets[ i ].list );
				
			}
			for (var attrname in result) { ans[attrname] = result[attrname]; }
		}

		combinationList.length = 0;
		combinationList = generateCombination( 1, this._listSets.length );

		return { list: ans };
	}; 

//
	this._updateIntersectSets = function ( ans ) {

		IntersectionSet = {};

		for ( key in ans.list ) {
			IntersectionSet[ key ] = { list: ans.list[key], combination: [] }
		}

		for ( i = 0; i < combinationList.length; i++ )
			for ( j = 0; j < combinationList[i].length; j++ )
				IntersectionSet[ combinationList[i][j].reverse().join("in") ]["combination"] = combinationList[i][j];
	};

//update a specific set name
	this._updateName = function ( i, name ){
		this._listSets[i].name = name;
		nameList[i] = name;

		var text = d3.select( "#titleText" + (i + 1) )

		if ( text.node() )
			text.text( name );
	}

//update text when the intersection set is changed
	this._updateText = function () {
		
		if ( !IntersectionSet )
			return;

		for ( key in IntersectionSet ){
			var targetText = d3.select( "#text" + key );

			if ( targetText[0][0] ){
				targetText.text( IntersectionSet[ key ].list.size() )
			}
		}
	}

	this._getIntersectSets = function(){
		return IntersectionSet;
	}

	this._setclickChartCallback = function( x ){
		if ( x && x instanceof Function )
			clickChartCallback = x;
	}

	this._getIntersectSetsName = function ( combination ) {
		return getNameByCombination(combination);
	}

	this._updatelastRequireSet = function( key ){
		lastRequireSet = key;
	}

	this._getlastRequireSet = function () {
		return lastRequireSet;
	}

	this._savefile = function ( fileName ,textToWrite ) {
		var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
		var fileNameToSaveAs = fileName;

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		downloadLink.id = "use-to-download-text-file"

		if (window.webkitURL != null)
		{
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}
		else
		{
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}

		downloadLink.click();
	}

	var lastRequireSet = "";

	var clickChartCallback = "";

	//predefine number of sets in Venn diagram.
	this._N = 7;
	//where the data of sets store.
	//_listSets[index]: where index is integer starting from 0
	//structure: { name: , list: }
	//name is used to store list name
	this._listSets = [];
	//store for the list name, once the name of list is updated.
	//( _listSets[i],name is updated. ) This one must also be updated.
	var nameList = [];
	//	intersect Sets structure:
	//	IntersectionSet[ key ]: key must be a string.
	//	for set 1, input "1", for set 1in2 input "1in2"
	//	combination: list of this intersect set component.
	//			For example, 1in2 is intersect of 1 and 2.
	//			combination = [ 1, 2 ]
	//	list: the elements inside the intersect set.
 	var IntersectionSet;

	
	//	combinationList: this array is used for store all the combinations.
	//	For example, for a 3 sets venn diagram
	//	combinationList = [ [3], [2], [3, 2], [1], [3, 1], [2, 1], [3, 2, 1] ]
	
	var combinationList = [];
	var textPosition = [];

	var predefineColor = [];
	var predefineShape = [];
	var predefineIntersectText = [];

	var predefineStrokeColor = "#259286";

	var selectedStrokeFillOpacity = 1;
	var unselectedStrokeFillOpacity = 0;

	var StrokeWidth = 2;

	var selectedShapeFillOpacity = 0.8;
	var unselectedShapeFillOpacity = 0.35;

	//store all graph transform arguments: translate and scale
	var transform = [];

	for ( i = 0; i < this._N; i++ )
		transform.push( { x: 0, y: 0, scale: 1 } );

	//starting from this point is magic! Don't touch!
	//This maigc is used for predefined ellipsis and polygons.
	//special case for 1 to 3 sets Venn diagram
	//predefine circle
	var circleR = 110;	//control the radius of circles

	//One set venn diagram, only have one circle
	predefineShape[1] = [{ "id": 1, "cx": 230, "cy": 306, "rotate": 0, "textX": 215, "textY": 310 }];

	//two sets venn diagram, two circle
	predefineShape[2] = [{ "id": 1, "cx": 230, "cy": 306, "rotate": 0, "textX": 215, "textY": 310 },
							   { "id": 2, "cx": 370, "cy": 306, "rotate": 0, "textX": 365, "textY": 310 }];

	//three sets venn diagram
	predefineShape[3] = [{ "id": 1, "cx": 230, "cy": 306, "rotate": 0, "textX": 215, "textY": 310 },
							   { "id": 2, "cx": 370, "cy": 306, "rotate": 0, "textX": 365, "textY": 310 },
							   { "id": 3, "cx": 300, "cy": 185, "rotate": 0, "textX": 290, "textY": 180 }];

	for ( i = 1; i <= 3; i++ ) {
		for ( j = 0; j < i; j++ ) {
			predefineShape[i][j].rx = circleR;
			predefineShape[i][j].ry = circleR;
		}
	}

	//------------------ end of circle case -------------------------

	var ellipseRX = 200, ellipseRY = 110;
	//predefine ellipsis for 4 sets venn diagram
	predefineShape[4] = [	{ "id": 1, "cx": 196, "cy": 246,"rotate": 45,  "textX": 70,  "textY": 135 },
								{ "id": 2, "cx": 266, "cy": 176,"rotate": 45,  "textX": 138, "textY": 55 },
								{ "id": 3, "cx": 326, "cy": 176,"rotate": 135, "textX": 435, "textY": 58 },
								{ "id": 4, "cx": 396, "cy": 246,"rotate": 135, "textX": 508, "textY": 135 }];

	//predefine ellipsis for 5 sets venn diagram
	predefineShape[5] = [	{ "id": 1, "cx": 263, "cy": 213,"rotate": 90,  "textX": 258, "textY": 50  },
							{ "id": 2, "cx": 280, "cy": 262,"rotate": 162, "textX": 438, "textY": 216 },
							{ "id": 3, "cx": 241, "cy": 292,"rotate": 54,  "textX": 330, "textY": 433 },
							{ "id": 4, "cx": 199, "cy": 266,"rotate": 126, "textX": 90,  "textY": 409 },
							{ "id": 5, "cx": 212, "cy": 216,"rotate": 18,  "textX": 42,  "textY": 166 }];

	//predefine triangles for 6 sets venn diagram
	predefineShape[6] = [	{ "id": 1, "textX": 115, "textY": 120, "d": "M  51.277  38.868 L 255.580 191.186 L 190.900 269.427 Z" },
							{ "id": 2, "textX": 197, "textY":  90, "d": "M 201.988  26.426 L 158.444 276.222 L 241.044 235.111 Z" },
							{ "id": 3, "textX": 275, "textY": 130, "d": "M 323.271  79.619 L 159.604 152.683 L 204.652 276.669 Z" },
						  	{ "id": 4, "textX": 295, "textY": 250, "d": "M 453.561 295.349 L 181.764 146.805 L 158.980 252.461 Z" },
							{ "id": 5, "textX": 215, "textY": 320, "d": "M 251.886 455.785 L 158.136 181.491 L 214.208  94.690 Z" },
							{ "id": 6, "textX": 135, "textY": 290, "d": "M  60.184 344.046 L 262.476 109.903 L 223.276 253.962 Z" }];

	//predefine ellipsis for 7 sets venn diagram
	predefineShape[7] = [	{ "id": 1, "cx": 220, "cy": 288,"rotate": 0,   "textX": 40,  "textY": 228 },
							{ "id": 2, "cx": 216, "cy": 246,"rotate": 51,  "textX": 96,  "textY": 117 },
							{ "id": 3, "cx": 246, "cy": 217,"rotate": 102, "textX": 273, "textY": 49  },
							{ "id": 4, "cx": 289, "cy": 222,"rotate": 154, "textX": 434, "textY": 152 },
							{ "id": 5, "cx": 310, "cy": 258,"rotate": 25,  "textX": 458, "textY": 341 },
							{ "id": 6, "cx": 296, "cy": 298,"rotate": 77,  "textX": 330, "textY": 472 },
							{ "id": 7, "cx": 256, "cy": 311,"rotate": 135, "textX": 132, "textY": 440 }];

	for ( i = 4; i <= this._N; i++ ) {
		//6 sets Venn diagram is a special case
		if ( i != 6 ) {
			for ( j = 0; j < i; j++ ){
				predefineShape[i][j].rx = ellipseRX;
				predefineShape[i][j].ry = ellipseRY;
			}
		}
	}

	predefineIntersectText[2] = [ { "id": "1in2", "textX": 290, "textY": 330 } ];
	predefineIntersectText[3] = [ { "id": "1in2", "textX": 290, "textY": 330 },
								{ "id": "1in3", "textX": 240, "textY": 240,  },
								{ "id": "2in3", "textX": 340, "textY": 240,  },
								{ "id": "1in2in3", "textX": 290, "textY": 270 } ];

	predefineIntersectText[4] = [ { "id": "1in2", "textX": 146, "textY": 127 },
								{ "id": "1in3", "textX": 194, "textY": 311 },
								{ "id": "1in4", "textX": 294, "textY": 368 },
								{ "id": "2in3", "textX": 291, "textY": 118 },
								{ "id": "2in4", "textX": 389, "textY": 309 },
								{ "id": "3in4", "textX": 433, "textY": 141 },
								{ "id": "1in2in3", "textX": 223, "textY": 201 }, 
								{ "id": "1in2in4", "textX": 341, "textY": 328 },
								{ "id": "1in3in4", "textX": 246, "textY": 329 },
								{ "id": "2in3in4", "textX": 366, "textY": 208 },
								{ "id": "1in2in3in4", "textX": 290, "textY": 278 } ]

	predefineIntersectText[5] = [ { "id": "1in2in3in4in5", "textX": 236, "textY": 250 } ];
	predefineIntersectText[6] = [ { "id": "1in2in3in4in5in6", "textX": 200.66335, "textY": 217.0728 } ];
	predefineIntersectText[7] = [ { "id": "1in2in3in4in5in6in7", "textX": 236, "textY": 250 } ];

	//magic finished
	predefineColor = [ "","red", "orange", "#BABA00", "green", "blue", "indigo", "violet", "brown" ];

	//define drawing canvas/
	var w = 650, h = 650;

	var svg = d3.select( "#" + target )
				.append("svg")
				.attr("width", w)
				.attr("height", h);

    var tooltip = d3.select("body").append("div")
		.attr( "id", "vennToolTip" )
		.style("position", "absolute")
		.style("text-align", "center")
		.style("width", "220px")
		.style("background", "#333")
		.style("color", "#ddd")
		.style("border", "0px")
		.style("border-radius", "8px")
		.style("opacity", 0);

	tooltip.append( "p" )
		.append( "strong" ).attr("id", "vennToolTipTitle").style( "color", "white" );

	tooltip.append( "p" )
		.attr("id", "vennToolTipListSize").style( "color", "white" );

	tooltip.append( "div" )
		.attr("id", "vennToolTipList").style( "color", "white" );
    
    if ( clickCallback )
    	clickChartCallback = clickCallback;

    if ( lists )
    	this.updateAllList( lists );
}

exports.BioJSVenn.prototype = VennPrototype;