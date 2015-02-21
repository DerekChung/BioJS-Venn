/*global d3:false */
/*global require:false */
/*global alert:false */



var biojsVenn = require( 'biojs-vis-venn' );

//require( 'd3' );

var clickCallback = function ( obj ) {
  'use strict';
  var i;
  var text = obj.title + ':\n';
  
  text += obj.list.join('\n');

  d3.select( '#intersectSetList' ).node().value = text;

  for ( i = 1; i <= N; i++ ) {
    d3.select( '#inlineCheckbox' + i ).property( 'checked', false );
  }

  for ( i = 0; i < obj.combination.length; i++ ) {
    d3.select( '#inlineCheckbox' + obj.combination[i] )
    .property( 'checked', true );
  }
};

var venn = new biojsVenn.BioJSVenn( 'first' );

venn.setClickCallback( clickCallback );

var N = venn.getMaxVennSets();

//read in file
d3.select('#files').on('change' ,function() {
  'use strict';
  var files = this.files;
  if (!files.length) { return; }

  var file = files[0];
  var reader = new FileReader();

  reader.onloadend = function(evt) {
    if (evt.target.readyState !== FileReader.DONE) { // DONE == 2
      return;
    }
    
    try{
      var data = evt.target.result;
      venn.readJSON( data );
      
      data = JSON.parse(evt.target.result);
      
      var counter = 0;
      for ( var key in data ) {
        if ( data.hasOwnProperty(key) ) {
          var text = data[key].join('\n');
          counter++;
          d3.select( '#s' + counter).node().value = text;
          d3.select( '#title' + counter ).node().value = key;
          d3.select( '#inlineCheckboxLabel' + counter ).text( key );
          d3.select( '#inlineCheckbox' + counter ).node().disabled = false;
        }
      }

      for ( var i = counter + 1; i <= N; i++ ){
        d3.select('#s' + i).node().value = '';
        d3.select('#inlineCheckbox' + i ).node().disabled = true;
      }

    } catch(e) {
      alert('Not a JSON file.');
    }
    
  };

  var blob = file.slice( 0, file.size);
  reader.readAsBinaryString(blob);
});

d3.select('#load-simple-file').on('click' ,function() {
  'use strict';
  var data = {
    's1': ['G000001', 'G000002', 'G000003', 'G000004', 'G000005'],
    's2': ['G000001', 'G000002', 'G000003', 'G000007', 'G000008'],
    's3': ['G000001', 'G000002', 'G000003', 'G000004', 'G000012'],
    's4': ['G000001', 'G000002', 'G000003', 'G000006', 'G000004'],
    's5': ['G000001', 'G000002', 'G000003', 'G000007', 'G000008'],
    's6': ['G000001', 'G000002', 'G000003', 'G000005', 'G000004'],
    's7': ['G000001', 'G000002', 'G000003', 'G000006', 'G000008']
  };

  venn.updateAllList( data );

  var counter = 0;
  for ( var key in data ) {
    if ( data.hasOwnProperty(key) ){
      counter++;
      var text = data[key].join('\n');
      d3.select( '#s' + counter).node().value = text;
      d3.select( '#title' + counter ).node().value = key;
      d3.select( '#inlineCheckboxLabel' + counter ).text( key );
      d3.select( '#inlineCheckbox' + counter ).node().disabled = false;
    }
  }

  for ( var i = counter + 1; i <= N; i++ ){
    d3.select('#s' + i).node().value = '';
    d3.select('#inlineCheckbox' + i ).node().disabled = true;
  }
});


//output the union list
function checkboxUpdate() {
  'use strict';
  var target = [];
  var start;

  for ( start = 1; start <= N; start++ ) {
    if ( d3.select( '#inlineCheckbox' + start ).node().checked ) {
      target.push( start );
      break; 
    }
  }

  for ( var i = start + 1; i <= N; i++ ) {
    if ( d3.select( '#inlineCheckbox' + i ).node().checked ) {
      target.push( i );
    }
  }
  
  var intersectionSet = venn.getRequiredList( target, false );

  if ( intersectionSet ) {
    var text = intersectionSet.title + ':\n';
    text += intersectionSet.list.join('\n');

    d3.select('#intersectSetList').node().value = text;
  }
  else {
    d3.select('#intersectSetList').node().value = '';
  }
}

for ( var i = 1; i <= N; i++ ){
  var changeCallback = checkboxUpdate;
  d3.select( '#inlineCheckbox' + i ).on( 'change', checkboxUpdate );
}

//take user input from textarea
//once the value changed it calls fucntion update to update the list
//---
function listUpdate( index ) {
  'use strict';
  return function() {
    var i;
    if ( index > venn.getNumberOfSets() ) {
      for ( i = venn.getNumberOfSets() + 1; i < index; i++ ) {
        venn.addList( d3.select( '#title' + i ).node().value, [] );
      }

      venn.addList( d3.select( '#title' + index ).node().value, this.value.split('\n') );
    }
    else {
      venn.updateList( index - 1, d3.select( '#title' + index ).node().value, this.value.split('\n') );
    }

    for ( i = 1; i <= N; i++ ) {
      d3.select( '#inlineCheckbox' + i ).node().disabled = false;
    }

    for ( i = N; i >= 1; i-- ) {

      if ( d3.select( '#s' + i ).node().value !== '' ){
        return;
      }
      
      d3.select( '#inlineCheckbox' + i ).node().disabled = true;
    }
  };
}

for ( i = 1; i <= N; i++ ){
  var changeCallback = listUpdate( i );
  d3.select( '#s' + i ).on( 'change', changeCallback );
}

function titleUpdate( index ){
  'use strict';
  return function() {
    venn.updateListName( index - 1, this.value );

    d3.select( '#inlineCheckboxLabel' + index ).text( this.value );
  };
}

for ( i = 1; i <= N; i++ ){
  var titleUpdateCall = titleUpdate( i );
  d3.select( '#title' + i ).on( 'change', titleUpdateCall );
}

d3.select( '#radio-inline-predefine' ).on( 'change', function() {
                                          'use strict'; 
                                          if ( this.checked ) {
                                            venn.switchLayout('predefined'); 
                                          }
                                        } );

d3.select( '#radio-inline-auto' ).on( 'change', function () {
                'use strict';
                if ( this.checked ){
                  venn.switchLayout('auto'); 
                }
              } );

d3.select( '#save-svg-png' ).on( 'click', function () { 
  'use strict'; 
  venn.saveAsPNG(); } );

d3.select( '#save-require-list' ).on( 'click', function () { 
  'use strict'; 
  venn.saveLastQueriedSets(); } );

d3.select( '#save-all-list' ).on( 'click', function () { 
  'use strict'; 
  venn.saveAllSets(); } );