/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/**
 * bkoTableDisplay
 * This is the output display component for displaying tables.
 */
(function() {
  'use strict';
  beaker.bkoDirective('Table', ["bkCellMenuPluginManager", function(bkCellMenuPluginManager) {
    var CELL_TYPE = "bko-tabledisplay";
    return {
      template: '<div class="slickgrid" style="height:350px;"></div>',
      controller: function($scope) {
        $scope.getShareMenuPlugin = function() {
          return bkCellMenuPluginManager.getPlugin(CELL_TYPE);
        };
        $scope.$watch("getShareMenuPlugin()", function() {
          var newItems = bkCellMenuPluginManager.getMenuItems(CELL_TYPE, $scope);
          $scope.model.resetShareMenuItems(newItems);
        });

        $scope.getColumns = function() {
          var columns = _.map($scope.model.getCellModel().columnNames, function(col) {
            return {id: col, name: col, field: col, sortable: true};
          });
          var elm = document.createElement('div');
          $(elm).addClass('ui-widget').addClass('slick-cell');
          var getWidth = function(text) {
            $(elm).html(text);
            $('body').append(elm);
            var width = $(elm).width();
            $(elm).remove();
            return width + 10;
          };

          _.each(columns, function(col) {
            col.width = getWidth(col.field);
          });
          var r, c, row, col, width;
          for (r = 0; r < $scope.model.getCellModel().values.length && r < 10; ++r) {
            row = $scope.model.getCellModel().values[r];
            for (c = 0; c < columns.length; c++) {
              width = getWidth(row[c]);
              col = columns[c];
              if (width > col.width) {
                col.width = width;
              }
            }
          }
          var timeCol = _.find(columns, function(it) {
            return it.field === "time";
          });
          if (timeCol) {
            // if the server provides the converted timeStrings, just use it
            if ($scope.model.getCellModel().timeStrings) {
              var timeStrings = $scope.model.getCellModel().timeStrings;
              timeCol.width = getWidth(timeStrings[0]);
              timeCol.formatter = function(row, cell, value, columnDef, dataContext) {
                return timeStrings[row];
              };
            } else {
              timeCol.width = getWidth("20110101 23:00:00.000 000 000");
              timeCol.formatter = function(row, cell, value, columnDef, dataContext) {
                var nano = value % 1000;
                var micro = (value / 1000) % 1000;
                var milli = value / 1000 / 1000;
                var time = moment(milli);
                var tz = $scope.model.getCellModel().timeZone;
                if (tz)
                  time.tz(tz);
                return time.format("YYYYMMDD HH:mm:ss.SSS");
              };
            }
          }
          return columns;
        };
      },
      link: function(scope, element, attrs) {
        var div = element.find('div');
        var data = _.map(scope.model.getCellModel().values, function(row) {
          return _.object(scope.model.getCellModel().columnNames, row);
        });
        var columns = scope.getColumns();
        var options = {
          enableCellNavigation: true,
          enableColumnReorder: true,
          multiColumnSort: true,
          selectedCellCssClass: 'bk-table-cell-selected'
          //forceFitColumns: true
        };
        var grid = new Slick.Grid(div, data, columns, options);
        grid.onSort.subscribe(function(e, args) {
          var cols = args.sortCols;
          data.sort(function(dataRow1, dataRow2) {
            for (var i = 0, l = cols.length; i < l; i++) {
              var field = cols[i].sortCol.field;
              var sign = cols[i].sortAsc ? 1 : -1;
              var value1 = dataRow1[field], value2 = dataRow2[field];
              var result = (value1 === value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
              if (result !== 0) {
                return result;
              }
            }
            return 0;
          });
          grid.invalidate();
          grid.render();
        });

        // Use the plugin to allow copy/paste from other spreadsheets.
        // See http://labs.nereo.com/slick.html
        // See slick.cellexternalcopymanager.js for the options doc.
        var externalCopyManagerOpts = {
          copiedCellStyle: 'bk-table-copied-cell'
        };
        // Selection is pre-req of copying.
        var gridCellSelectionModel = new Slick.CellSelectionModel();
        var gridCellExternalCopyManager = new Slick.CellExternalCopyManager(externalCopyManagerOpts);
        grid.setSelectionModel(gridCellSelectionModel);
        grid.registerPlugin(gridCellExternalCopyManager);

        scope.$on("$destroy", function() {
          gridCellSelectionModel.destroy();
          grid.destroy();
          gridCellExternalCopyManager.destroy();
        });

        //table needs to be redrawn to get column sizes correct
        setTimeout(function() {
          var hasHorizontalScroll = function() {
            var viewport = element.find('.slick-viewport')[0];
            return viewport.clientWidth !== viewport.scrollWidth;
          };
          var h = element.find('.slick-header').height();
          h += element.find('.slick-row').size() * element.find('.slick-row').height();
          h += hasHorizontalScroll() ? 20 : 4;
          if (h < 500) {
            div.height(h);
            grid.resizeCanvas();
          }
        }, 5);
      }
    };
  }]);
})();
