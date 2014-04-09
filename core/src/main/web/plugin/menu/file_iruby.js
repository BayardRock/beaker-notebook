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
 * File menu plugin for IRuby notebook
 * This adds a menu items to the File menu: open...(IRuby), that loads IRuby notebook and
 * convert it to a Beaker noteboook
 */
(function() {
  'use strict';
  var notebookConverter = (function() {
    var generateID = function(length) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < length; ++i) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };
    var convertCodeCell = function(ipyCodeCell) {
      var bkrCodeCell = {
        "id": "code" + generateID(6),
        "evaluator": "IRuby",
        "class": ["code"],
        "input": {
          "body": ""
        },
        "output": {
        }
      };
      if (ipyCodeCell.input && ipyCodeCell.input.length > 0) {
        bkrCodeCell.input.body = ipyCodeCell.input.join('\n');
      }
      if (ipyCodeCell.outputs && ipyCodeCell.outputs.length > 0) {
        var ipyOutput = ipyCodeCell.outputs[0];
        if (ipyOutput.output_type === "pyout" && ipyOutput.text) {
          bkrCodeCell.output.selectedType = "Text";
          bkrCodeCell.output.result = ipyOutput.text[0]
        } else if (ipyOutput.output_type === "display_data" && ipyOutput.png) {
          bkrCodeCell.output.selectedType = "Image";
          bkrCodeCell.output.result = {
            "type": "ImageIcon",
            "imageData": ipyOutput.png
          }
        }
      } else {
        bkrCodeCell.output.result = "";
      }

      return bkrCodeCell;
    };

    var convertMarkDownCell = function(ipyMDCell) {
      var bkrMDCell = {
        "id": "markdown" + generateID(6),
        "class": ["markdown"],
        "body": "",
        "mode": "preview"
      };
      if (ipyMDCell.source && ipyMDCell.source.length > 0) {
        bkrMDCell.body = ipyMDCell.source.join("\n");
      }

      return bkrMDCell;
    };

    var convertRawCell = function(ipyRawCell) {
      var bkrTextCell = {
        "id": "text" + generateID(6),
        "class": ["text"],
        "body": ""
      };
      if (ipyRawCell.source && ipyRawCell.source.length > 0) {
        bkrTextCell.body = ipyRawCell.source.join("\n");
      }
      return bkrTextCell;
    };

    var convertHeadingCell = function(ipyHeadingCell) {
      var bkrTextCell = {
        "id": "text" + generateID(6),
        "class": ["text"],
        "body": ""
      };
      if (ipyHeadingCell.source && ipyHeadingCell.source.length > 0) {
        bkrTextCell.body = ipyHeadingCell.source.join("\n");
      }
      bkrTextCell.body = "<h" + ipyHeadingCell.level + ">" + bkrTextCell.body +
          "</h" + ipyHeadingCell.level + ">";
      return bkrTextCell;
    };

    var newBeakerNotebook = function() {
      return {
        "beaker": "1",
        "evaluators": [
          {
            "name": "Html",
            "plugin": "./plugin/evaluator/html.js"
          },
          {
            "name": "Latex",
            "plugin": "./plugin/evaluator/latex.js"
          },
          {
            "name": "IRuby",
            "plugin": "IRuby",
            "imports": "",
            "supplementalClassPath": ""
          }
        ],
        cells: [
          {
            "id": "root",
            "class": ["notebook", "container"]
          }
        ],
        tagMap: {
          "root": []
        },
        tagMap2: {
          "initialization": [],
          "IRuby": []
        }
      };
    };

    return {
      convert: function(ipyNb) {
//                if (ipyNb.nbformat !== 3 || ipyNb.nbformat_minor !== 0) {
//                    throw "unrecognized iPython notebook format version"
//                }

        var bkrNb = newBeakerNotebook();
        ipyNb.worksheets[0].cells.forEach(function(cell) {
          var bkrCell;
          if (cell.cell_type === "code") {
            bkrCell = convertCodeCell(cell)
          } else if (cell.cell_type === "markdown") {
            bkrCell = convertMarkDownCell(cell);
          } else if (cell.cell_type === "raw") {
            bkrCell = convertRawCell(cell);
          } else if (cell.cell_type === "heading") {
            bkrCell = convertHeadingCell(cell);
          } else {
            console.warn("unrecognized cell type: ", cell.cell_type, cell);
          }
          if (bkrCell) {
            bkrNb.cells.push(bkrCell);
            bkrNb.tagMap.root.push(bkrCell.id);
            bkrNb.tagMap2.IRuby.push(bkrCell.id);
          }
        });
        return bkrNb;
      }
    };
  })();

  var IPYNB_PATH_PREFIX = "ipynb";
  bkHelper.setImporter(IPYNB_PATH_PREFIX, {
    open: function(fileContentAsString) {
      var ipyNbJson = fileContentAsString;
      var ipyNb = JSON.parse(ipyNbJson);
      var bkrNb = notebookConverter.convert(ipyNb);
      return bkrNb;
    }
  });

  bkHelper.getHomeDirectory().then(function(homeDir) {
    var toAdd = [
      {
        parent: "File",
        submenu: "Open",
        items: [
          {
            name: "Open... (.ipynb)",
            reducedName: "Open...",
            tooltip: "Open a IRuby notebook from file system and convert it to Beaker notebook",
            action: function() {
              bkHelper.showFileChooser(
                  function(originalUrl) {
                    bkHelper.openURI(originalUrl, IPYNB_PATH_PREFIX);
                  },
                  '<div class="modal-header">' +
                      '   <h1>Open <span ng-show="getStrategy().treeViewfs.showSpinner"><i class="fa fa-refresh fa-spin"></i></span></h1>' +
                      '</div>' +
                      '<div class="modal-body">' +
                      '   <tree-view rooturi="/" fs="getStrategy().treeViewfs"></tree-view>' +
                      '   <tree-view rooturi="' + homeDir + '" fs="getStrategy().treeViewfs"></tree-view>' +
                      '</div>' +
                      '<div class="modal-footer">' +
                      "   <div class='text-left'>Enter a file path (e.g. /Users/...) or URL (e.g. http://...):</div>" +
                      '   <p><input id="openFileInput" class="input-xxlarge" ng-model="getStrategy().result" ng-keypress="getStrategy().close($event, close)" focus-start /></p>' +
                      '   <button ng-click="close()" class="btn">Cancel</button>' +
                      '   <button ng-click="close(getStrategy().result)" class="btn btn-primary">Open</button>' +
                      '</div>', // template
                  bkHelper.getFileSystemChooserStrategy()
              );
            }
          }
        ]
      }
    ];
    pluginObj.onReady(toAdd);
  });
})();
