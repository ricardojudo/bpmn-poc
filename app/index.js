'use strict';

var fs = require('fs');

var $ = require('jquery'),
    BpmnModeler = require('bpmn-js/lib/Modeler');

var container = $('#js-drop-zone');

var canvas = $('#js-canvas');

var modeler = new BpmnModeler({ container: canvas });

var newDiagramXML = fs.readFileSync(__dirname + '/../resources/newDiagram.bpmn', 'utf-8');

function createNewDiagram() {
  openDiagram(newDiagramXML);
}

function openDiagram(xml) {

  modeler.importXML(xml, function(err) {

    if (err) {
      container
        .removeClass('with-diagram')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-diagram');
      
      //$('.toolbar-item').addClass('active');

    }


  });
}

function saveSVG(done) {
  modeler.saveSVG(done);
}

function saveDiagram(done) {

  modeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var xml = e.target.result;
      callback(xml);
    };
    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


function readDiagram(e, callback){
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    openDiagram(contents);
    callback();
  };
  reader.readAsText(file);
  
}

////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}


// bootstrap diagram functions

$(function() {

  $('.js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    createNewDiagram();
  });




  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');
  var newDiagramLink = $('#js-create-diagram-toolbar');
  var openDiagram = $('js-open-diagram');


  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      newDiagramLink.addClass('active');
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
      
    } else {
      newDiagramLink.removeClass('active');
      link.removeClass('active');
      
    }
  }

  var _ = require('lodash');

  var exportArtifacts = _.debounce(function() {

    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  var _readDiagram = function(e){
    readDiagram(e,exportArtifacts);
  };


  document.getElementById('js-open-diagram')
  .addEventListener('change', _readDiagram, false);


  modeler.on('commandStack.changed', exportArtifacts);
});