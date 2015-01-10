require('d3');
var sets = require('simplesets')

var VennPrototype = {

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
		this._name = [];
		
		var ans = {};
		var counter = 0;

		for ( key in data ) {
			if ( ++counter > this._N ) {
				break;
			}
			this._listSets[ counter ] = new sets.Set(data[key]);
			this._name[ counter ] = key;
		}

		if ( counter - 1 == this._N ) {
			var ans = this._generateAllIntersectSets( 1, 7 );

		}
		else{
			var ans = this._generateAllIntersectSets( 1, counter );
		}

		this._updateIntersectSets( ans );
		this._updateGraph();

	}
}

exports.BioJSVenn = function( target, lists ) {

	if ( !target )
		return;

	//call this when mouse over event is triggered
	var mouseOverCall = function ( target, id ){
		d3.select(target).transition()
		  .style( "fill-opacity",  selectedShapeFillOpacity )
		  .style( "stroke-opacity", selectedStrokeFillOpacity);

		//Update the tooltip position and value
		var b = d3.select("#venntooltip").transition()
		.style("left", (d3.event.pageX - 100) + "px")
		.style("top", (d3.event.pageY - 100) + "px")
		.style("position", "absolute")
		.style("opacity", 0.5 )
		.style("z-index", 9)  
		.text( function (d) { 

			var text = IntersectionSetName[ id ] + ":\n";

			if ( IntersectionSet[ id ] )
				text += IntersectionSet[ id ].array().join("\n");
			
			return text;
		});

		var a = 1;
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
		d3.select("#venntooltip").style("opacity", 0 ); 
	};

	var mouseMoveCall = function (traget) {
		d3.select("#venntooltip")
			.style("left", (d3.event.pageX - 100) + "px")
			.style("top", (d3.event.pageY - 100) + "px")	
	};

	var drawEllipse = function ( jsonData ){

		if ( jsonData.length == 0 )
			return;

		var targetTransform = jsonData.length - 1;

		var elem = svg.append("g")
						.attr( "transform", "scale(" + transform[ targetTransform ].scale + ") "
											+ "translate(" + transform[ targetTransform ].x + ", "
											+ transform[ targetTransform ].y + ")" )
						.selectAll("_")
						.data(jsonData)
						.enter()
						.append("g");

		elem.attr( "id", function (d) { return "shape" + d.id } )
			.append( "ellipse" )
			.attr("transform", function (d) { return "rotate(" + d.rotate + ", " + d.cx + ", " + d.cy + ") " })
    		.attr("cx", function (d) { return d.cx} ).attr("cy", function (d) { return d.cy } )
    		.attr("rx", function (d) { return d.rx} ).attr("ry", function (d) { return d.ry } )
    		.style("fill", function(d) { return predefineColor[d.id] })
			.style("fill-opacity", unselectedShapeFillOpacity )
			.style("stroke-opacity", unselectedStrokeFillOpacity )
			.style("stroke", predefineStrokeColor )
			.style("stroke-width", StrokeWidth )
			.on("mouseover", function (d) {  mouseOverCall(this, d.id); })
		    .on("mouseout", function (d)  {  mouseOutCall(this, d.id); })
		    .on("mousemove", function (d) { mouseMoveCall(this); });

		elem.append( "text" )
			.attr( "id", function (d) { return "text" + d.id } )
			.text( function (d){
				if ( !IntersectionSet[ d.id.toString() ] )
					return 0;
				else
					return IntersectionSet[ d.id.toString() ].size() } )
			.attr("x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY });
		     
	};

	var drawPath = function ( jsonData ){

		if ( jsonData.length == 0 )
			return;

		/*  How to seperate Polygon and intersect?
			Take a look at the predefine JSON data at the very begining.
			For interesct area, the id is String. (e.g. "1_2")
		
		Here is how to check is the data for intersect or for shape.

		if ( typeof jsonData[1].id == 'string' || jsonData.id instanceof String) {

		}
		*/

		var elem = gvennStage.selectAll("_")
							 .data(jsonData)
							 .enter()
							 .append("g");

		elem.append("path")
			.attr( "id", function (d){ return d.id } )
			.attr( "d", function (d){ return d.d } )
			.attr("transform", function (d) { return  "translate(" + d.translateX + ", " + d.translateY + ") "
			 										+ "scale(" + d.scale + ")" })
			.attr( "fill", function (d) {
				//check if it is shape or intersect area
				if ( typeof d.id == 'string' || d.id instanceof String)
					//return color for intersect area
					return "transparent";
				else
					//return color for shape
					return predefineColor[d.id];
			} )
			.style("fill-opacity", function (d) {
				//check if it is shape or intersect area
				if ( typeof d.id == 'string' || d.id instanceof String)
					//return fill-opacity for intersect area stroke
					return 0;
				else
					//return fill-opacity for shape
					return unselectedShapeFillOpacity;
			} )
			.style("stroke-opacity", unselectedStrokeFillOpacity )
			.style("stroke", function (d) {
				//check if it is shape or intersect area
				if ( typeof d.id == 'string' || d.id instanceof String)
					//return color for intersect area stroke
					return "white";
				else
					//return color for shape stroke
					return predefineStrokeColor;
			} )
			.style("stroke-width", StrokeWidth )
			 .on("mouseover", function (d) {  mouseOverCall(this, d.id); })
		     .on("mouseout", function (d) {  mouseOutCall(this, d.id); })
		     .on("mousemove", function (d) { mouseMoveCall(this); });

		elem.append( "text" )
			.attr( "id", function (d){ return "text" + d.id } )
			.text( function (d){
				if ( !IntersectionSet[ d.id.toString() ] )
					return 0;
				else
					return IntersectionSet[ d.id.toString() ].size() } )
			.attr("x", function (d) { return d.textX } ).attr("y", function(d){ return d.textY });

	};

	this._updateGraph = function () {
		if ( this._listSets.length - 1 != 6 ) {
			drawEllipse( predefineShape[ this._listSets.length - 1 ] );
		}
	};

	this._generateAllIntersectSets = function ( start, end ){

		var ans = {};
		var name = {};

		for ( var i = end; i >= start; i-- ) {
			var result = {};
			var name_result = {};

			if ( this._listSets[i] ) {
				result[ i.toString() ] = this._listSets[i];
				name_result[ i.toString() ] = this._name[i];
			}

			for ( var key in ans ){
				if ( this._listSets[ i ] ) {
					result[i.toString() + "∩" + key] = ans[key].intersection( this._listSets[ i ] );
					name_result[i.toString() + "∩" + key] = this._name[i] + "∩" + result[ key ];
				}
			}
			for (var attrname in result) { ans[attrname] = result[attrname]; }
			for (var attrname in name_result) { name[attrname] = name_result[attrname]; }
		}

		return { list: ans, lName: name};
	}; 

	this._updateIntersectSets = function ( ans ) {
		IntersectionSet = ans.list;
		IntersectionSetName = ans.lName;
	}

	//predefine number of sets in Venn diagram.
	//magic, don't touch
	this._name = [];

	this._N = 7;
	this._listSets = [];
	var IntersectionSet;
	var IntersectionSetName;

	var predefineColor = [];
	var predefineIntersectPath = [];
	var predefineShape = [];

	var predefineStrokeColor = "#259286";

	var selectedStrokeFillOpacity = 1;
	var unselectedStrokeFillOpacity = 0;

	var StrokeWidth = 2;

	var selectedShapeFillOpacity = 0.6;
	var unselectedShapeFillOpacity = 0.3;

	var transform = [];

	//special case for 1 to 3 sets Venn diagram
	//predefine circle
	var circleR = 110;	//control the radius of circles

	for ( i = 0; i < this._N; i++ )
		transform.push( { x: 0, y: 0, scale: 1 } );

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

    var tooltip = d3.select("#" + target).append("div")
		.attr( "id", "venntooltip" )
		.style("position", "absolute")
		.style("text-align", "center")
		.style("width", "220px")
		.style("height", "220px")
		.style("background", "#333")
		.style("color", "#ddd")
		.style("border", "0px")
		.style("border-radius", "8px")
		.style("opacity", 0);

	tooltip.append( "p" )
		.append( "strong" ).attr("id", "vennToolTipTitle");

	tooltip.append( "p" )
		.attr("id", "vennToolTipList");

    this.updateAllList( lists );

}

exports.BioJSVenn.prototype = VennPrototype;

var data = { "list-1": ["A", "B", "C", "D" ],
			 "list-2": ["A", "B", "D", "E", "F" ] };

var test = new exports.BioJSVenn( "first", data );