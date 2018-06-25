;(function() {
  'use strict';
  window.tpv = window.tpv || {};

  tpv.controller = function() {

    var data = [
      {
        'name': 'person',
        'size': 1
      },
      {
        'name': 'bbbbb',
        'size': 30
      },
      {
        'name': 'ccccc',
        'size': 10000
      },
    ];

    var chart = tpv.vortex().data(data);

    chart();

  };

}());
