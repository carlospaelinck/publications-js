(function() {
  'use strict';

  angular.module('pub.documents.controllers', [])

    .value('typefaces', ['Source Serif Pro', 'Source Sans Pro'])

    .value('fontWeights', [{weight: '400'}, {weight: '500'}, {weight: '600'}])

    .value('objAnchors', {
      size: 10,
      points: [
        {coordinate: 'nw', x: 0, y: 0},
        {coordinate: 'n', x: 0.5, y: 0},
        {coordinate: 'ne', x: 1, y: 0},
        {coordinate: 'w', x: 0, y: 0.5},
        {coordinate: 'e', x: 1, y: 0.5},
        {coordinate: 'sw', x: 0, y: 1},
        {coordinate: 's', x: 0.5, y: 1},
        {coordinate: 'se', x: 1, y: 1}
      ]
    })

    .value('colors', [
      '#fff', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575',
      '#616161', '#424242', '#212121', '#000', '#d50000', '#f44336',
      '#e91e63', '#9c27b0', '#ba68c8', '#7e57c2', '#3f51b5', '#2196f3',
      '#90caf9', '#03A9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
      '#aeea00', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548'
    ])

    .controller('DocumentsController', [
      '$scope', 
      '$state', 
      '$location', 
      'Restangular', 
      'documentServices', 
      'authentication', 
      'documents', 
      'typefaces',
      function($scope, $state, $location, Restangular, documentServices, authentication, documents, typefaces) {
        var documentsApi = Restangular.all('documents');

        $scope.updateAuthenticationStatus();
        $scope.documents = documents;
        $scope.dpi = 72;
        $scope.iconDpi = 15;
        $scope.newDocumentModalVisible = false;
        $scope.sortFilter = 'name';
        $scope.sortReverse = false;
        $scope.typefaces = typefaces;
        $scope.documentsApi = documentsApi;
                        
        $scope.updateSortFilter = function(sortFilter, sortReverse) {
          $scope.sortFilter = sortFilter;
          $scope.sortReverse = sortReverse;
        };

        $scope.viewUser = function() {
          $state.go('pub.user');
        };

        $scope.deleteDocument = function(sender) {
          _.remove($scope.documents, function(doc) {
            return doc._id === sender._id;
          })
          sender.remove();
        };

        $scope.documentIconSize = function(doc) {
          var iconDpi = 15,
            iconWidth = Math.max(Math.min(doc.width * iconDpi, 160), 30),
            iconHeight = (iconWidth / doc.width) * doc.height;

          return {width: iconWidth + 'px', height: iconHeight + 'px'};
        };
      }
    ])
    
    .controller('DocumentsIndexController', [
      '$scope', 
      '$state',
      '$location',
      function($scope, $state, $location) {
        $scope.selectedDoc = null;

        $scope.newDocument = function() {
          $scope.documentsApi.post({
            _user: $scope.user._id,
            name: $scope.newName,
            width: $scope.newWidth,
            height: $scope.newHeight,
            shapes: []
          }).then(function(res) {
            $scope.newDocumentModal()
            $scope.documents.push(res)
          });
        };
        
        $scope.documentIconSelected = function(sender) {
	        $scope.selectedDoc = sender;
        };
        
        $scope.openDocument = function(doc) {
          $state.go('pub.documents.document.view', {
            documentId: doc._id
          });          
        };
        
        $scope.newDocumentModal = function() {
          $scope.newDocumentModalVisible = !$scope.newDocumentModalVisible;
          $scope.newName = '';
          $scope.newWidth = '';
          $scope.newHeight = '';
        };
      }
    ])

    .controller('DocumentController', [
      '$scope', 
      '$state', 
      '$window', 
      '$timeout', 
      'documentServices', 
      'doc', 
      'colors',
      function($scope, $state, $window, $timeout, documentServices, doc, colors) {
        $scope.doc = doc;
        $scope.selectedObj = null;
        $scope.showCanvasGrid = true;
        $scope.snapToGrid = true;
        $scope.currentInspector = 'document';
        $scope.clipboard = null;
        $scope.showInspector = false;
        $scope.zoomLevel = 1;
        $scope.colors = colors;

        $scope.updateDocument = function(closeDocumentView) {
          $scope.doc.put();

          if (closeDocumentView) {
            var idx = _.findIndex($scope.documents, { _id : $scope.doc._id });
            $scope.documents[idx] = $scope.doc;
            $scope.showAllDocuments();
          }
        };

        $scope.showAllDocuments = function() {
          $state.go('pub.documents.index');
        };

        $scope.shiftLayer = function(offset) {
          $scope.doc.shapes.moveElement($scope.selectedObj, offset);
        };

        $scope.toggleCanvasGrid = function() {
          $scope.showCanvasGrid = !$scope.showCanvasGrid;
        };

        $scope.toggleSnapToGrid = function() {
          $scope.snapToGrid = !$scope.snapToGrid;
        };

        $scope.downloadPdf = function() {
          $scope.doc.put().then(function() {
            var documentPdfRoute = '/documents/' + $scope.doc._id + '/pdf';
            $window.location = documentPdfRoute;
          });
        };

        $scope.toggleInspector = function(inspector) {
          $scope.currentInspector = inspector;
        };

        $scope.svgObjectSelected = function(obj) {
          $scope.selectedObj = obj;
          $scope.showInspector = obj !== null;

          if (!obj && $scope.currentInspector === 'color') {
            $scope.toggleInspector('shape');
          }
        };

        $scope.cutObj = function() {
          $scope.clipboard = angular.copy($scope.selectedObj);
          var objIdx = $scope.doc.shapes.indexOf($scope.selectedObj);
          $scope.doc.shapes.splice(objIdx, 1);
          $scope.selectedObj = null;
        };

        $scope.deleteObj = function() {
          var objIdx = $scope.doc.shapes.indexOf($scope.selectedObj);
          $scope.doc.shapes.splice(objIdx, 1);
          $scope.selectedObj = null;
        };

        $scope.copyObj = function() {
          $scope.clipboard = angular.copy($scope.selectedObj);
        };

        $scope.pasteObj = function() {
          var duplicateObj = angular.copy($scope.clipboard);
          duplicateObj._id = undefined;
          duplicateObj.x += 0.25;
          duplicateObj.y += 0.25;
          $scope.doc.shapes.push(duplicateObj);
        };

        $scope.addObject = function(objType) {
          $scope.doc.shapes.push(documentServices.newShape(objType));
        };
      }
    ])

    .controller('DocumentCanvasController', [
      '$scope', 
      'documentServices', 
      'objAnchors',
      function($scope, documentServices, objAnchors) {
        $scope.objAnchors = objAnchors;

        $scope.xAxisRange = function() {
          return _.range($scope.doc.width / 0.25);
        };

        $scope.yAxisRange = function() {
          return _.range($scope.doc.height / 0.25);
        };

        $scope.unitDivider = function() {
          return ($scope.zoomLevel > 1) ? 0.5 : 1;
        };
      }
    ])
}());
