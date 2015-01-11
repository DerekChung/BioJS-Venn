require('d3');
var sets = require('simplesets')

var VennPrototype = {

	autoLayout: true,

	switchToAutoMode: function () {
		this.autoLayout = true;
		this._updateGraph();
	},

	switchToPredfinedMode: function () {
		this.autoLayout = false;
		this._updateGraph();
	},

	updateName: function ( targetList, name ){



	},

	readJSON: function( text ) {
		
		try {
			var data = JSON.parse(text);

			this.updateAllList( data );
	    }
	    catch ( e ){
	    	alert( "Wrong JSON format." );
	    }
	},

	updateAllList: function ( data ) {
		
		this._listSets = [];
		
		var ans = {};
		var counter = 0;

		for ( key in data ) {
			if ( ++counter > this._N ) {
				break;
			}
			this._listSets[ counter ] = {  name: key , list: new sets.Set(data[key])};
			this._updateName( counter, key );
		}

		if ( counter - 1 == this._N ) 
			ans = this._generateAllIntersectSets( 1, 7 );
		else
			ans = this._generateAllIntersectSets( 1, counter );

		this._updateIntersectSets( ans );
		this._updateGraph();

	}
}

exports.BioJSVenn = function( target, lists ) {

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

	//call this when mouse over event is triggered
	var mouseOverCall = function ( target, id ){
		d3.select(target).transition()
		  .style( "fill-opacity",  function() {
		  		if ( typeof id == 'string' || id instanceof String)
		  			return 0.4;
		  		else 
		  			return selectedShapeFillOpacity;
		  		}
		  	)
		  .style( "stroke-opacity", selectedStrokeFillOpacity);

		//Update the tooltip position and value
		d3.select("#vennToolTip").transition()
		.style("left", (d3.event.pageX - 250) + "px")
		.style("top", (d3.event.pageY - 5) + "px")
		.style("position", "absolute")
		.style("opacity", 0.6 )
		.style("z-index", 9)

		d3.select("#vennToolTipTitle")
			.text( function (d) { 

			var combination = IntersectionSet[ id ].combination;
			var text =  nameList[ combination[0] ].name;

			for ( i = 1; i < combination.length; i++ ){
				text += " ∩ " + nameList[ combination[i] ].name;
			}

			var text = IntersectionSet[ id ].name + ":\n";
			
			return text;
		});

		d3.select( "#vennToolTipList" )
			.text( function (d) {
				var text = "";

				if ( IntersectionSet[ id ] )
					text += IntersectionSet[ id ].list.array().join("\n");
				
				return text;
			} );
	};

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
       
       //Hide the tooltip
		d3.select("#vennToolTip").style("opacity", 0 ); 
	};

	var mouseMoveCall = function (traget) {
		d3.select("#vennToolTip")
			.style("left", (d3.event.pageX - 250) + "px")
			.style("top", (d3.event.pageY - 5) + "px")	
	};

	var drawEllipse = function ( jsonData ){

		if ( jsonData.length == 0 )
			return;
		
		svg.select( "*" ).remove();

		var targetTransform = jsonData.length - 1;

		var transformGroup = svg.append("g")
								.attr( "transform", "scale(" + transform[ targetTransform ].scale + ") "
											+ "translate(" + transform[ targetTransform ].x + ", "
											+ transform[ targetTransform ].y + ")" )

		var defs = transformGroup.append( "defs" )
								.selectAll("_")
								.data(jsonData)
								.enter()
								.append("g");

		defs.append( "clipPath" )
			.attr( "id", function (d) { return "clip" + d.id } )
			.append( "ellipse" )
			.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
			.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
			.attr("rx", function (d) { return d.rx} ).attr("ry", function (d) { return d.ry } );

		/* This part is used to create a fake Stroke for the clipping. However, this part is not longer used.
		defs.append( "clipPath" )
			.attr( "id", function (d) { return "clipL" + d.id } )
			.append( "ellipse" )
			.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
			.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
			.attr("rx", function (d) { return d.rx + StrokeWidth} ).attr("ry", function (d) { return d.ry + StrokeWidth} );
		*/
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
				.on("mousemove", function (d) { mouseMoveCall(this); });

		shapeGroup.append( "text" )
				.attr( "id", function (d) { return "text" + d.id } )
				.text( function (d){
					if ( !IntersectionSet[ d.id.toString() ] )
						return 0;
					else
						return IntersectionSet[ d.id.toString() ].list.size() 
				} )
				.attr("x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY });

		/*
		combinationList -> 	4
							3 4,3
							2 4,2 3,2 4,3,2
							1 4,1 4,3,1 2,1 4,2,1  
		*/

		drawClip( combinationList, transformGroup );
		    
	};

	var drawPath = function ( jsonData ){

		if ( jsonData.length == 0 )
			return;

		svg.select( "*" ).remove();

		/*  How to seperate Polygon and intersect?
			Take a look at the predefine JSON data at the very begining.
			For interesct area, the id is String. (e.g. "1_2")
		
		Here is how to check is the data for intersect or for shape.

		if ( typeof jsonData[1].id == 'string' || jsonData.id instanceof String) {

		}
		*/

		var targetTransform = jsonData.length - 1;

		var transformGroup = svg.append("g")
								.attr( "transform", "scale(" + transform[ targetTransform ].scale + ") "
											+ "translate(" + transform[ targetTransform ].x + ", "
											+ transform[ targetTransform ].y + ")" )

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


		shapeGroup.attr( "id", function (d) { return "clip" + d.id } )
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
				.on("mousemove", function (d) { mouseMoveCall(this); });

		shapeGroup.append( "text" )
			.attr( "id", function (d){ return "text" + d.id } )
			.text( function (d){
				if ( !IntersectionSet[ d.id.toString() ] )
					return 0;
				else
					return IntersectionSet[ d.id.toString() ].list.size() } )
			.attr("x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY });

		/*
		combinationList -> 	4
							3 4,3
							2 4,2 3,2 4,3,2
							1 4,1 4,3,1 2,1 4,2,1  
		*/

		drawClip( combinationList, transformGroup );

	};

	var drawVenn = function (num) {

		var toRadian = function ( degree ) {
			return degree * Math.PI / 180;
		}

		var rotateAngle = 360 / num;
		var rotateRadian = toRadian( rotateAngle );
		var baseRadian = toRadian( (180 - rotateAngle) / 2 );
		var startAngle = 0;
		var length = 42;
		var rx = 220, ry = 110;
		var hypotenuse;

		if ( rotateAngle == 180 ) 
			hypotenuse = length * 2;
		else
			hypotenuse = length / Math.sin( baseRadian ) * Math.sin( rotateRadian );

		var x = 350, y = 300;

		//Setup for text, here the variables are array. (for future extension)
		var tx = [], ty = [], tlength = [], thypotenuse = []; 
		tx.push( x + rx * 0.8)
		ty.push( y );
		tlength.push( tx[0] - x + length);
		if ( rotateAngle == 180 ) 
			thypotenuse.push(tlength[0] * 2);
		else
			thypotenuse.push(tlength[0] / Math.sin( baseRadian ) * Math.sin( rotateRadian ));

		var rx = 200, ry = 110;

		var shapePosition = [];
		var textPosition = [];

		shapePosition.push( { "x": x, "y": y } );
		textPosition.push( { "x": tx[0], "y": ty[0] } )

		for ( i = 0; i < num; i++ ) {
			var nextX = shapePosition[i].x + hypotenuse * Math.cos( (Math.PI - baseRadian) + rotateRadian * i );
			var nextY = shapePosition[i].y + hypotenuse * Math.sin( (Math.PI - baseRadian) + rotateRadian * i );
			shapePosition.push( { "x": nextX, "y": nextY } );

			var nextTextX = textPosition[i].x + thypotenuse[0] * Math.cos( (Math.PI - baseRadian) + rotateRadian * i );
			var nextTextY = textPosition[i].y + thypotenuse[0] * Math.sin( (Math.PI - baseRadian) + rotateRadian * i );
			textPosition.push( { "x": nextTextX, "y": nextTextY } );
		}

		var transformGroup = svg.append("g")
								.attr( "transform", "scale(" + transform[num - 1].scale + ") "
										+ "translate(" + transform[num - 1].x + ", "
										+ transform[num - 1].y + ")" )

		var graphData = [], textData = [];

		for ( i = 0; i < num; i++ ) {
			graphData.push( { "id": i + 1, "cx": shapePosition[i].x, "cy": shapePosition[i].y, "rotate": rotateAngle * i, "rx": 220, "ry": 110 } )
			textData.push( { "id": i + 1, "x": textPosition[i].x , "y": textPosition[i].y } );
		}

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
			.on("mousemove", function (d) { mouseMoveCall(this); });

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
	}

	var drawClip = function ( combination, drawOn ) {

		var clip = function ( reuseID, group, clipID, i, j ){

			for ( var k = 0; k < combination[i].length; k++ ){
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

				var targetID = combination[i][j].join("∩");

				var group = drawOn.append( "g" )
								.attr( "id", "g" + targetID )
								.style( "fill-opacity", 0 );

				//clip( "clipL", group, "L" + targetID ).style( "fill", "white" );
				
				clip( "clip", group, targetID, i, j ).on("mouseover", function (d) { mouseOverCall( "#g" + this.id , this.id ) } ) 
								.on("mouseout", function (d) {  mouseOutCall("#g" + this.id, this.id); })
								.on("mousemove", function (d) { mouseMoveCall(this); });
			}
		}
	}


	this._updateGraph = function () {

		svg.select("*").remove();
		if ( this.autoLayout ){
			drawVenn( this._listSets.length - 1 );
		}
		else{
			if ( this._listSets.length - 1 != 6 ) 
				drawEllipse( predefineShape[ this._listSets.length - 1 ] );
			else
				drawPath( predefineShape[ this._listSets.length - 1 ] );
		}
	};

	this._generateAllIntersectSets = function ( start, end ){

		var ans = {};
		var name = {};

		for ( var i = end; i >= start; i-- ) {
			var result = {};
			var name_result = {};

			if ( this._listSets[i] ) {
				result[ i.toString() ] = this._listSets[i].list;
				name_result[ i.toString() ] = this._listSets[i].name;
			}

			for ( var key in ans ){
				if ( this._listSets[ i ] ) {
					result[i.toString() + "∩" + key] = ans[key].intersection( this._listSets[ i ].list );
					name_result[i.toString() + "∩" + key] = this._listSets[i].name + " ∩ " + name[ key ];
				}
			}
			for (var attrname in result) { ans[attrname] = result[attrname]; }
			for (var attrname in name_result) { name[attrname] = name_result[attrname]; }
		}

		combinationList.length = 0;
		
		combinationList = generateCombination( start, end );

		return { list: ans, lName: name};
	}; 

	this._updateIntersectSets = function ( ans ) {

		IntersectionSet = {};

		for ( key in ans.list ) {
			IntersectionSet[ key ] = { name: ans.lName[key], list: ans.list[key], combination: [] }
		}

		for ( i = 0; i < combinationList.length; i++ )
			for ( j = 0; j < combinationList[i].length; j++ )
				IntersectionSet[ combinationList[i][j].reverse().join("∩") ]["combination"] = combinationList[i][j];
	};

	this._updateName = function ( i, name ){
		nameList[i] = name;
	}

	//predefine number of sets in Venn diagram.
	//magic, don't touch
	this._N = 7;
	this._listSets = [];
	var nameList = [];
	var IntersectionSet;

	/*
		combinationList: this array is used for store all the combinations.
		For example, there are 3 sets. The intersect set will be the combinations
		of these 3 sets. 
	*/
	var combinationList = [];

	var predefineColor = [];
	var predefineIntersectPath = [];
	var predefineShape = [];

	var predefineStrokeColor = "#259286";

	var selectedStrokeFillOpacity = 1;
	var unselectedStrokeFillOpacity = 0;

	var StrokeWidth = 2;

	var selectedShapeFillOpacity = 0.6;
	var unselectedShapeFillOpacity = 0.25;

	var transform = [];

	for ( i = 0; i < this._N; i++ )
		transform.push( { x: 0, y: 0, scale: 1 } );

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
	predefineShape[7] = [	{ "id": 1, "cx": 220, "cy": 228,"rotate": 0,   "textX": 40,  "textY": 294 },
								{ "id": 2, "cx": 216, "cy": 246,"rotate": 51,  "textX": 96,  "textY": 117 },
								{ "id": 3, "cx": 246, "cy": 217,"rotate": 102, "textX": 273, "textY": 49  },
								{ "id": 4, "cx": 289, "cy": 222,"rotate": 154, "textX": 434, "textY": 152 },
								{ "id": 5, "cx": 310, "cy": 258,"rotate": 25,  "textX": 458, "textY": 341 },
								{ "id": 6, "cx": 296, "cy": 298,"rotate": 77,  "textX": 330, "textY": 472 },
								{ "id": 7, "cx": 256, "cy": 311,"rotate": 135, "textX": 132, "textY": 440 }];

	predefineColor = [ "","red", "orange", "yellow", "green", "blue", "indigo", "violet", "brown" ];

	for ( i = 4; i <= this._N; i++ ) {
		//6 sets Venn diagram is a special case
		if ( i != 6 ) {
			for ( j = 0; j < i; j++ ){
				predefineShape[i][j].rx = ellipseRX;
				predefineShape[i][j].ry = ellipseRY;
			}
		}
	}
	//magic finished

	//define drawing canvas/
	var w = 746, h = 900;
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
		.attr("id", "vennToolTipList").style( "color", "white" );

    for ( var i = 1; i <= this._N; i++ )
    	combinationList.push( generateCombination( 1, i ) );
    
    this.updateAllList( lists );

}

exports.BioJSVenn.prototype = VennPrototype;

var data = { "list-1": ["A", "B", "C", "D" ],
			 "list-2": ["A", "B", "D", "E", "F" ],
			 "list-3": ["A", "1", "2", "3", "4", "E", "F"],
			 "list-4": ["A", "q", "w", "r", "4", "E", "F"],
			 "list-5": ["A", "g", "w", "r", "E" ],
			 "list-6": ["A", "g", "~" ],
			 "list-7": ["A", "q", "l", "1" ] };

var test = new exports.BioJSVenn( "first", data );
