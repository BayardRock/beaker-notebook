/*
 *  Copyright 2014 TWO SIGMA INVESTMENTS, LLC
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
 * M_bkoVega
 * This is the output display component for displaying vega JSON (http://trifacta.github.io/vega/).
 */
define(function (require, exports, module) {
    'use strict';
    var NAME = "Vega"
    beaker.bkoDirective(NAME, function () {
        return {
            template: "<input type='text' ng-model='model'></input>" +
                "<button ng-click='parse()'>parse</button>" +
                "<div id='vis'></div>",
            controller: function ($scope) {
                var parse = function (spec) {

                    if (_.isString(spec)) {
                        try {
                            spec = JSON.parse(spec);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    vg.parse.spec(spec, function (chart) {
                        var view = chart({el: "#vis"}).update();
                    });
                };
                $scope.parse = function () {
                    console.log("parse", $scope.model.getCellModel());
                    parse($scope.model.getCellModel());
                };
            }
        };
    });
    exports.name = NAME;
//    exports.isApplicable = function (result) {
//        return (result.type === "Latex");
//    };
    beaker.registerOutputDisplay("Vege", [NAME], 0);
});