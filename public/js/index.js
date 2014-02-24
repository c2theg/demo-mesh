var mesh = require('rtc-mesh');
var loader = require('fdom/loader');
var crel = require('crel');
var uuid = require('uuid');
var opts = {
  config: {
    iceServers: [
    ]
  }
};

// set this to true to update as moving, scaling, rotating events occur
var dynamicUpdates = false;

// cdn deps
var cdndeps = [
  '//cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min.js'
];

function joined(err, m) {
  function addObject(obj, label) {
    // add the object to the canvas
    canvas.add(obj);

    // tag the object
    obj._label = label || uuid.v4();

    // add the object into mesh data
    m.data.set(obj._label, obj.toJSON());
  }

  function updateState(evt) {
    // TODO: debounce
    if (evt.target && evt.target._label) {
      m.data.set(evt.target._label, evt.target.toJSON());
    }
  }

  function remoteUpdate(data, clock, srcId) {
    var key;
    var target;

    if (srcId === m.id) {
      return;
    }

    key = data[0];
    target = canvas._objects.filter(function(obj) {
      return obj._label === key;
    })[0];

    // if we don't have the target, then add the target
    if (! target) {
      // use fabric deserialization
      fabric.util.enlivenObjects([data[1]], function(objects) {
        objects[0]._label = key;
        canvas.add(objects[0]);
      });
    }
    else {
      target.set(data[1]);
      canvas.renderAll();
    }
  }

  canvas.on('object:modified', updateState);

  // if dynamic updates are enabled then communicate changes
  // as they are happening in the UI
  if (dynamicUpdates) {
    canvas.on({
      'object:moving': updateState,
      'object:scaling': updateState,
      'object:rotating': updateState
    });
  }

  m.data.on('update', remoteUpdate);

  m.on('sync', function() {
    console.log('synced');

    if (m.data.get('startrect')) {
      return;
    }

    addObject(new fabric.Text('hello', {
      left: 210,
      top: 100
    }), 'testlabel');

    addObject(new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'blue',
      height: 100,
      width: 100
    }), 'startrect');
  });
}

function initCanvas() {
  document.body.appendChild(crel('canvas', {
    id: 'c',
    width: window.innerWidth,
    height: window.innerHeight
  }));

  canvas = new fabric.Canvas('c');
  mesh.join('rtc-mesh-drawtest', opts, joined);
}

loader(cdndeps, initCanvas);