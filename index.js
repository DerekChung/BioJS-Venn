require('d3');

var VennPrototype = {

	readJSON: function( data ) {

	}

}

exports.BioJSVenn = function( target, lists ) {

	if ( !target )
		return;

	//predefine number of sets in Venn diagram.
	this._N = 7;
	this._listSets = [];
	this._IntersectionSet;

	this._predefineColor = [];
	this._predefineIntersectPath = [];
	this._predefineShape = [];

	this._predefineStrokeColor = "#259286";

	this._selectedStrokeFillOpacity = 1,
	this._unselectedStrokeFillOpacity = 0;

	this._StrokeWidth = 2;

	this._selectedShapeFillOpacity = 0.6, 
	this._unselectedShapeFillOpacity = 0.3;

	this._transform = [];

	//special case for 1 to 3 sets Venn diagram
	//predefine circle
	var circleR = 110;	//control the radius of circles

	for ( i = 0; i < _N; i++ )
		this._transform.push( { x: 0, y: 0, scale: 1 } );

	//One set venn diagram, only have one circle
	this._predefineShape[1] = [{ "id": 1, "cx": 230, "cy": 306, "rotate": 0, "textX": 215, "textY": 310 }];

	//two sets venn diagram, two circle
	this._predefineShape[2] = [{ "id": 1, "cx": 230, "cy": 306, "rotate": 0, "textX": 215, "textY": 310 },
							   { "id": 2, "cx": 370, "cy": 306, "rotate": 0, "textX": 365, "textY": 310 }];

	//three sets venn diagram
	this._predefineShape[3] = [{ "id": 1, "cx": 230, "cy": 306, "rotate": 0, "textX": 215, "textY": 310 },
							   { "id": 2, "cx": 370, "cy": 306, "rotate": 0, "textX": 365, "textY": 310 },
							   { "id": 3, "cx": 300, "cy": 185, "rotate": 0, "textX": 290, "textY": 180 }];

	for ( i = 1; i <= 3; i++ ) {
		for ( j = 0; j < i; j++ ) {
			this._predefineShape[i][j].rx = _circleR;
			this._predefineShape[i][j].ry = _circleR;
		}
	}

	//------------------ end of circle case -------------------------

	var _ellipseRX = 200, _ellipseRY = 110;
	//predefine ellipsis for 4 sets venn diagram
	this._predefineShape[4] = [	{ "id": 1, "cx": 196, "cy": 246,"rotate": 45,  "textX": 70,  "textY": 135 },
								{ "id": 2, "cx": 266, "cy": 176,"rotate": 45,  "textX": 138, "textY": 55 },
								{ "id": 3, "cx": 326, "cy": 176,"rotate": 135, "textX": 435, "textY": 58 },
								{ "id": 4, "cx": 396, "cy": 246,"rotate": 135, "textX": 508, "textY": 135 }];

	//predefine ellipsis for 5 sets venn diagram
	this._predefineShape[5] = [	{ "id": 1, "cx": 263, "cy": 213,"rotate": 90,  "textX": 258, "textY": 50  },
								{ "id": 2, "cx": 280, "cy": 262,"rotate": 162, "textX": 438, "textY": 216 },
								{ "id": 3, "cx": 241, "cy": 292,"rotate": 54,  "textX": 330, "textY": 433 },
								{ "id": 4, "cx": 199, "cy": 266,"rotate": 126, "textX": 90,  "textY": 409 },
								{ "id": 5, "cx": 212, "cy": 216,"rotate": 18,  "textX": 42,  "textY": 166 }];

	//predefine triangles for 6 sets venn diagram
	this._predefineShape[6] = [	{ "id": 1, "textX": 115, "textY": 120, "d": "M  51.277  38.868 L 255.580 191.186 L 190.900 269.427 Z" },
								{ "id": 2, "textX": 197, "textY":  90, "d": "M 201.988  26.426 L 158.444 276.222 L 241.044 235.111 Z" },
								{ "id": 3, "textX": 275, "textY": 130, "d": "M 323.271  79.619 L 159.604 152.683 L 204.652 276.669 Z" },
						  		{ "id": 4, "textX": 295, "textY": 250, "d": "M 453.561 295.349 L 181.764 146.805 L 158.980 252.461 Z" },
								{ "id": 5, "textX": 215, "textY": 320, "d": "M 251.886 455.785 L 158.136 181.491 L 214.208  94.690 Z" },
								{ "id": 6, "textX": 135, "textY": 290, "d": "M  60.184 344.046 L 262.476 109.903 L 223.276 253.962 Z" }];

	//predefine ellipsis for 7 sets venn diagram
	this._predefineShape[7] = [	{ "id": 1, "cx": 220, "cy": 228,"rotate": 0,   "textX": 40,  "textY": 294 },
								{ "id": 2, "cx": 216, "cy": 246,"rotate": 51,  "textX": 96,  "textY": 117 },
								{ "id": 3, "cx": 246, "cy": 217,"rotate": 102, "textX": 273, "textY": 49  },
								{ "id": 4, "cx": 289, "cy": 222,"rotate": 154, "textX": 434, "textY": 152 },
								{ "id": 5, "cx": 310, "cy": 258,"rotate": 25,  "textX": 458, "textY": 341 },
								{ "id": 6, "cx": 296, "cy": 298,"rotate": 77,  "textX": 330, "textY": 472 },
								{ "id": 7, "cx": 256, "cy": 311,"rotate": 135, "textX": 132, "textY": 440 }];

	this._predefineColor = [ "","red", "orange", "yellow", "green", "blue", "indigo", "violet", "brown" ];

	for ( i = 4; i <= _N; i++ ) {
		//6 sets Venn diagram is a special case
		if ( i != 6 ) {
			for ( j = 0; j < i; j++ ){
				this._predefineShape[i][j].rx = _ellipseRX;
				this._predefineShape[i][j].ry = _ellipseRY;
			}
		}
	}


	//define drawing canvas/
	this._w = 746, this._h = 900;

	this._gvennStage = d3.select("#first")
						.append("svg")
						.attr("width", this._w)
						.attr("height", this._h);

}