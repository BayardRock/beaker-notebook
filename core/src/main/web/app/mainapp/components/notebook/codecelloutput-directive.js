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
 * This module is the abstract container for types of output displays. While we plan to make the output display loading
 * mechanism more pluggable, right now, this module serves as the registration output display types and holds the logic
 * for switch between applicable output display through UI.
 */
(function() {
  'use strict';
  var module = angular.module('bk.notebook');

  module.directive('bkCodeCellOutput', function(
      bkUtils, bkOutputDisplayFactory, bkEvaluatorManager) {
    return {
      restrict: "E",
      templateUrl: "./app/mainapp/components/notebook/codecelloutput.html",
      scope: {
        model: "=",
        evaluatorId: "@"
      },
      controller: function($scope) {
        var _shareMenuItems = [];

        $scope.getOutputResult = function() {
          return $scope.model.result;
        };
        $scope.applicableDisplays = [];
        $scope.$watch('getOutputResult()', function(result) {
          $scope.applicableDisplays = bkOutputDisplayFactory.getApplicableDisplays(result);
          $scope.model.selectedType = $scope.applicableDisplays[0];
        });

        // to be used in bkOutputDisplay
        $scope.outputDisplayModel = {
          getEvalId: function() {
            return $scope.model.eid;
          },
          getCellModel: function() {
            var result = $scope.getOutputResult();
            if (result && result.type === "BeakerDisplay") {
              return result.object;
            } else {
              return result;
            }
          },
          resetShareMenuItems: function(newItems) {
            _shareMenuItems = newItems;
          },
          getCometdUtil: function() {
            if ($scope.evaluatorId) {
              var evaluator = bkEvaluatorManager.getEvaluator($scope.evaluatorId);
              if (evaluator) {
                return evaluator.cometdUtil;
              }
            }
          }
        };

        $scope.getOutputDisplayType = function() {
          var type = $scope.model.selectedType;
          // if BeakerDisplay, use the inner type instead
          if (type === "BeakerDisplay") {
            var result = $scope.getOutputResult();
            type = result ? result.innertype : "Hidden";
          }
          return type;
        };

        var getElapsedTimeString = function() {
          if ($scope.model.elapsedTime || $scope.model.elapsedTime === 0) {
            var elapsedTime = $scope.model.elapsedTime;
            return "Elapsed time: " + bkUtils.formatTimeString(elapsedTime);
          }
          return "";
        };

        // to be used in output cell menu
        $scope.outputCellMenuModel = (function() {
          var _additionalMenuItems = [
            {
              name: "Share",
              items: function() {
                return _shareMenuItems;
              }
            },
            {
              name: "Delete",
              action: function() {
                $scope.model.result = undefined;
              }
            },
            {
              name: getElapsedTimeString,
              action: null
            }
          ];
          return {
            getApplicableDisplays: function() {
              return $scope.applicableDisplays;
            },
            getSelectedDisplay: function() {
              return $scope.model.selectedType;
            },
            setSelectedDisplay: function(display) {
              $scope.model.selectedType = display;
            },
            getAdditionalMenuItems: function() {
              return _additionalMenuItems;
            }
          };
        })();
      }
    };
  });

})();
