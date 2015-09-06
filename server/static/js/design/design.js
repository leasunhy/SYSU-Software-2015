/**
 * @file design.js
 * @description Help the user to design circuits and logics
 * @author JinJin Lin
 * @mail jinjin.lin@outlook.com
 * @data Aug 7 2015
 * @copyright 2015 SYSU-Software. All rights reserved.
 * 
 */

"use strict";
var operationLog;
var design;
var leftBar;
var rightBar;
var rubberband;
var designMenu;
var dfs;

//==========================================================================================
/**
 * @class CNode
 *
 * @method constructor
 *
 */
function CNode() {
	this.view = null;
	this.partType = null;
	this.partName = null;
	this.normalConnNum = 0;
	this.partID = null;
}

CNode.prototype.createCNode = function(partElem) {
	this.view = partElem;
	this.view.attr('normal-connect-num', '0');
	this.view.attr("part-name");
	this.view.removeAttr("class");

    var filterDiv = $("<div></div>");
    filterDiv.addClass("filterDiv");
    filterDiv.appendTo(this.view);

    var minusCircle = Util.createMinusCircleDiv();
    minusCircle.appendTo(this.view);

    this.view.find("img").removeAttr("class");
    this.view.css("text-align", "center");
    this.view.addClass("node");

    var titleDiv = $("<div></div>");
    titleDiv.css("text-align", "center");
    titleDiv.text(this.view.find("span").text());
    this.view.find("span").replaceWith(titleDiv);
}

CNode.prototype.setCNodeId = function(id) {
	this.partID = id;
}

//-===================================================
function DFS() {
	this.map = [];
}

DFS.prototype.addEdge = function(nodeElemA, nodeElemB) {
	var flagA = false;
	var flagB = false;
	nodeElemA.attr('dirty', '0');
	nodeElemB.attr('dirty','0');
	for (var i in this.map) {
		if (this.map[i][0].attr('part-id') == nodeElemA.attr('part-id')) {
			this.map[i].push(nodeElemB);
			flagA = true;
		}
		if (this.map[i][0].attr('part-id') == nodeElemB.attr('part-id')) {
			this.map[i].push(nodeElemA);
			flagB = true;
		}
	}
	if (flagA == false) {
		var list = [];
		list.push(nodeElemA);
		list.push(nodeElemB);
		this.map.push(list);
	}

	if (flagB == false) {
		var list = [];
		list.push(nodeElemB);
		list.push(nodeElemA);
		this.map.push(list);
	}
	// console.log("Add edge!!!!!!!!!!!!!!!!!!!");
};

DFS.prototype.createMap = function() {
	this.map = [];
	var connections = jsPlumb.getAllConnections();
	for (var i in connections) {
		if (connections[i].scope == "normal") {
			this.addEdge($(connections[i].source), $(connections[i].target));
		}
	}
};

DFS.prototype.searchCircuit = function() {
	var circuits = [];
	var queue = [];
	var circuit = [];
	for (var i in this.map) {
		if (this.map[i][0].attr('part-type') == "promoter" &&
			this.map[i][0].attr('normal-connect-num') == "1") {
			queue.push(this.map[i]);
		}
	}
	
	for (var i in queue) {
		// console.log("---------------------come in----------------");
		circuit = [];
		var head = queue[i];
		if (head[0].dirty == true) continue;
		circuit.push(head[0]);
		head[0].attr('dirty', '1');
		while ((head.length == 2 && head[1].attr('dirty') == '0') || head.length == 3) {
			if (head.length == 2) {
				// console.log("length == 2")
				circuit.push(head[1]);
				head[1].attr('dirty', '1');
				for (var j in this.map) {
					console.log(this.map[j][0].attr('dirty'));
					if (this.map[j][0].attr('part-id') == head[1].attr('part-id')) {
						console.log("hello world");
						head = this.map[j];
						break;
					}
				}
				// console.log(circuit);
			} else {
				// console.log("length == 3")
				var index;
				if (head[1].attr('dirty') == '1') index = 2;
				if (head[2].attr('dirty') == '1') index = 1;
				if (head[1].attr('dirty') == '1' && head[2].attr('dirty') == '1') {
					console.log("Error !!!");
					break;
				}
				circuit.push(head[index]);
				head[index].attr('dirty', '1');
				for (var j in this.map) {
					if (this.map[j][0].attr('part-id') == head[index].attr('part-id')) {
						head = this.map[j];
						break;
					}
				}
				// console.log(circuit);
			}
		}
		circuits.push(circuit.slice(0, circuit.length));
	}
	console.log(circuits);
	return circuits;
};

DFS.prototype.getCircuits = function() {
	this.createMap();
	var circuitsElems = this.searchCircuit();
	var circuits = [];
	var circuit = [];
	for (var i in circuitsElems) {
		circuit = [];
		for (var j in circuitsElems[i]) {
			console.log(circuitsElems[i][j]);
			console.log(circuitsElems[i][j].attr('part-name'));
			var part = DataManager.getPartByName(circuitsElems[i][j].attr('part-name'));
			circuit.push(part);
		}
		circuits.push(circuit);
	}
	return circuits;
}

//==========================================================================================
/**
 * @class Design
 *
 * @method constructor
 *
 */
function Design() {
    this.filterDiv = $(".filterDiv");
    this.nodes = $(".node");
    this.drawArea = $("#drawArea");
    this.drawMenu = $("#drawArea-menu");
    // this._isProOrInhiLink = false;
    this._isPromoteLink = false;
    this._isInhibitLink = false;
    this._putPartElemList = [];
    this._partCount = 0;

    this.nodeList = [];
    this.risk = 1;
};

Design.prototype.clear = function() {
    this._putPartElemList = [];
}

Design.prototype.init = function() {
    this._initJsPlumbOption();
    this._makeDrawAreaDroppabble();
    operationLog.init();
    operationLog.openFile();
};

Design.prototype.addProAndInhibitLine = function(partA) {
    var partNameA = partA.attr('part-name');
    for (var i in this._putPartElemList) {
        var partB = this._putPartElemList[i];
        var partNameB = partB.attr('part-name');
        if (DataManager.isProOrInhibitRelation(partNameA, partNameB)) {
            var lineType = DataManager.getLineType(partNameA, partNameB);
            this.drawLine(partA, partB, lineType);
        } else if (DataManager.isProOrInhibitRelation(partNameB, partNameA)) {
            var lineType = DataManager.getLineType(partNameB, partNameA);
            this.drawLine(partB, partA, lineType);
        }
    }
};

Design.prototype.drawLine = function(fromPartA, toPartB, lineType) {
    var overlaysClass = this._getOverLaysClass(lineType);
    var strokeStyle = this._getStorkeStyle(lineType);
    if (lineType == "promotion") this._isPromoteLink = true;
    if (lineType == "inhibition") this._isInhibitLink = true;
    // this._isProOrInhiLink = true;
    jsPlumb.connect({
        connector: ["Flowchart"],
        anchor: "Continuous",
        paintStyle: { strokeStyle: strokeStyle, lineWidth: 2 },
        // hoverPaintStyle: { strokeStyle: "blue" },
        source:fromPartA,
        target:toPartB,
        endpoint:"Blank",
        overlays: [overlaysClass],
        allowLoopback: true,
        Container: "drawArea",
        scope: lineType
    });
};

Design.prototype._getStorkeStyle = function(lineType) {
    if (lineType == 'normal') return "green";
    if (lineType == 'inhibition') return "red";
    if (lineType == "promotion") return "blue";
};

Design.prototype._getOverLaysClass = function(lineType) {
    if (lineType == 'normal') return  ["Custom", { create:function(component) {return $("<div></div>");}}];
    if (lineType == 'inhibition') return [ "Diamond", {width:25, length: 1, location:1, foldback:1}];
    if (lineType == "promotion") return ['Arrow', {width:25, length: 15, location:1, foldback:0.3}];
};

Design.prototype._makeDrawAreaDroppabble = function() {
    var that = this;
    this.drawArea.droppable({
        accept: '.item',
        containment: 'drawArea',
        drop:function(e, ui) {
            var dropedElement = ui.helper.clone();
            ui.helper.remove();
            
            var node = new CNode();
            node.createCNode($(dropedElement));

            node.view.appendTo("#drawArea");
            // dropedElement.appendTo('#drawArea');

            var left = node.view.position().left - leftBar.view.width();
            var top  = node.view.position().top - that.drawMenu.height();

            node.view.css({left:left, top:top});
            that.addDraggable(node.view);
            that.addProAndInhibitLine(node.view);
            that.makeSourceAndTarget(node.view);

            that._partCount += 1;
            var partName = dropedElement.attr("part-name");
            node.view.attr('part-id', partName + "_" + String(that._partCount));
            node.setCNodeId(partName + "_" + String(that._partCount));

            that._putPartElemList.push(node.view);
            that.nodeList.push(node);

            //Add to right bar
            var part = DataManager.getPartByName(partName);
            rightBar.processDropedPart(part);
            that.updateRisk(part);

            //write log
            operationLog.addPart(dropedElement.attr("part-name"));
        }
    });
}

Design.prototype.makeSourceAndTarget = function(elem) {
    jsPlumb.makeSource(elem, {
        filter: ".filterDiv",
        connector: ["Flowchart"],
        // connectorStyle: { strokeStyle: "green", lineWidth: 2 },
        anchor: "Continuous",
        endpoint:"Blank",
        overlays: [["Custom", { create:function(component) {return $("<div></div>");}}]],
        allowLoopback: false
    });

    jsPlumb.makeTarget(elem, {
        anchor: "Continuous",
        dropOptions: { hoverClass: "dragHover"},
        endpoint:"Blank",
        allowLoopback: false
    });
};

Design.prototype._initJsPlumbOption = function() {
	var that = this;
    jsPlumb.bind("connection", function(CurrentConnection) {
        var target = $(CurrentConnection.connection.target);
        var source = $(CurrentConnection.connection.source);
        var targetNormalNum = parseInt(target.attr("normal-connect-num"));
        var sourceNormalNum = parseInt(source.attr("normal-connect-num"));
        if (that._isInhibitLink == true) {
        	CurrentConnection.connection.scope = "inhibition";
            that._isInhibitLink = false;
        } else if (that._isPromoteLink == true) {
        	CurrentConnection.connection.scope = "promotion";
        	that._isPromoteLink = false;
        } else {
            CurrentConnection.connection.scope = "normal";
            if (sourceNormalNum === 2) {
                source.attr("data-content", "Most link to two objects");
                source.popup('show');
                source.removeAttr("data-content");
                jsPlumb.detach(CurrentConnection.connection);
                return;
            }
            if (targetNormalNum === 2){
                target.attr("data-content", "Most link to two objects");
                target.popup('show');
                target.removeAttr("data-content");
                jsPlumb.detach(CurrentConnection.connection);
                return;
            }
            sourceNormalNum += 1;
            source.attr("normal-connect-num", sourceNormalNum);
            targetNormalNum += 1;
            target.attr("normal-connect-num", targetNormalNum);

            operationLog.connectPart(source.attr("part-name"), target.attr("part-name"))
        }
    });

    jsPlumb.ready(function() {
        jsPlumb.setContainer(that.drawArea);
    });

    jsPlumb.bind('connectionDetached', function(info, originalEvent) {
    	var target = $(info.connection.target);
        var source = $(info.connection.source);
        var targetNormalNum = parseInt(target.attr("normal-connect-num"));
        var sourceNormalNum = parseInt(source.attr("normal-connect-num"));
        console.log(info);
        if (info.connection.scope == "normal") {
        	targetNormalNum -= 1;
        	sourceNormalNum -= 1;
        	source.attr("normal-connect-num", sourceNormalNum);
        	target.attr("normal-connect-num", targetNormalNum);
        }
    })

    jsPlumb.on(that.drawArea, "click", ".minus", function() {
        operationLog.removePart($(this.parentCNode.parentCNode).attr("part-name"));
        var node = that.getCNodeByPartId($(this.parentCNode.parentCNode).attr("part-id"));
        that.removeCNode(node);
        jsPlumb.remove(this.parentCNode.parentCNode);
    });
};

Design.prototype.getCNodeByPartId = function(partID) {
	for (var i in this.nodeList) {
		if (this.nodeList[i].view.attr('part-id') == partID) {
			return this.nodeList[i];
		}
	}
}

Design.prototype.removeCNode = function(node) {
	var index = this.nodeList.indexOf(node);
	this.nodeList.splice(index, 1);
	var index2 = this._putPartElemList.indexOf(node.view);
	this._putPartElemList.splice(index2, 1);
}

Design.prototype.addDraggable = function(elem) {
    jsPlumb.draggable(elem, {
        containment: 'parent',
    })
};

Design.prototype.updateRisk = function(part) {
    if (this.risk < part.risk) {
        this.updateRiskView(part.risk);
    }
}

Design.prototype.updateRiskView = function(risk) {
    var color;
    var popupStr;
    if (risk == 1) {
        color = "green";
        popupStr = "Low risk(1)";
    }
    if (risk == 2) {
        color = "orange";
        popupStr = "Moderate risk(2)"
    }
    if (risk == 3) {
        color = "pink";
        popupStr = "High risk(3)";
    }
    if (risk == 4) {
        color = "red";
        popupStr = "Extreme risk(4)"
    }
    $("#risk").removeClass("green orange pink red");
    $("#risk").addClass(color);
    $("#risk").attr("data-content", popupStr);
    $("#risk").popup("show");
}

//========================================================================================
/**
 * @class DesignMenu
 *
 * @method constructor
 *
 */
function DesignMenu() {
    this.menu = $("#drawArea-menu");
    this.saveBtn = $("#save");
    this.downloadBtn = $("#download");
    this.openFileBtn = $("#openFile");
    this.clearBtn = $("#clear");
    this.connPartBtn = $("#connect-part");
    this.minusBtn = $("#minus");

    this._isMinusBtnOpen = false;
    this._isConnectPartBtnOpen = true;
};

DesignMenu.prototype.init = function() {
    this.enableSaveCircuitchartBtn();
    this.enableDownloadBtn();
    this.enableLoadCircuitchartBtn();
    this.enableClearCircuitchartBtn();
    this.enableConnectPartBtn();
    this.enableRemovePartBtn();
    this.popUpAllButton();

    $("#risk").popup();
}

DesignMenu.prototype.popUpAllButton = function() {
    this.saveBtn.popup();
    this.downloadBtn.popup();
    this.openFileBtn.popup();
    this.clearBtn.popup();
    this.connPartBtn.popup();
    this.minusBtn.popup();
}

DesignMenu.prototype.enableRemovePartBtn = function() {
    var that = this;
    this.minusBtn.click(function() {
        if (that._isMinusBtnOpen == false) {
            that._isMinusBtnOpen = true;
            $(".minusCircle").each(function() {
                $(this).css("display", "block");
            });
        } else {
            that._isMinusBtnOpen = false;
            $(".minusCircle").each(function() {
                $(this).css("display", "none");
            });
        }
    });
}

DesignMenu.prototype.enableConnectPartBtn = function() {
    var that = this;
    this.connPartBtn.click(function() {
        if (that._isConnectPartBtnOpen == true) {
            that._isConnectPartBtnOpen = false;
            $(".filterDiv").each(function() {
                $(this).css("display", "none");
            });
        } else {
            that._isConnectPartBtnOpen = true;
            $(".filterDiv").each(function() {
                $(this).css("display", "block");
            });
        }
    });
};

DesignMenu.prototype.enableClearCircuitchartBtn = function() {
    this.clearBtn.click(function() {
        jsPlumb.empty("drawArea");
        design.clear();
    });
};

DesignMenu.prototype.enableSaveCircuitchartBtn = function(){
    var that = this;
    this.saveBtn.click(function() {
        $("#saveModal").modal("show");
    });

    $("#saveCircuitBtn").click(function() {
    	var there = this;
    	var img;
		var curcuitChartData = that.getDesignChartData();
		curcuitChartData.title = $("#curcuitName").val();
		curcuitChartData.introduction = $("#designIntro").val();
		curcuitChartData.source = "hello world";
		curcuitChartData.risk = design.risk;
		curcuitChartData.plasmids = dfs.getCircuits();

		$("#saveModal").modal("hide");
		var el = $("#drawArea").get(0);
		html2canvas(el, {
	        onrendered: function(canvas) {
	        	var that = this;
	            this.canvas = document.createElement('canvas');
	    		this.ctx = canvas.getContext('2d');
	            this.flows =  $("> svg", el);
	            this.flows.each(function() {
	                var svg = $(this)
	                var offset = svg.position();
	                var svgStr = this.outerHTML;
	                that.ctx.drawSvg(svgStr, offset.left, offset.top);
	            });

	            curcuitChartData.img = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
	            console.log(curcuitChartData);
            	var postDataJson = JSON.stringify(curcuitChartData);
            	console.log(postDataJson);
    //         	$.ajax({
				//     type: 'POST',
				//     contentType: 'application/json',
				//     url: '/calendar/all',
				//     dataType : 'json',
				//     data : postDataJson,
				// });
	        }
	    });
	});
};

DesignMenu.prototype.getDesignChartData = function() {
    var parts = this.getDesignParts();
    var connections = this.getDesignConns();
    var curcuitChart = {};
    curcuitChart.parts = parts;
    curcuitChart.title = "deviceName";
    curcuitChart.relationship = connections;
    curcuitChart.interfaceA = "interfaceB-partName";
    curcuitChart.interfaceB = "interfaceA-partName";
    return curcuitChart;
}

DesignMenu.prototype.getDesignConns = function() {
	var connections = [];
    $.each(jsPlumb.getAllConnections(), function (idx, CurrentConnection) {
        connections.push({
            start: $(CurrentConnection.source).attr("part-id"),
            end: $(CurrentConnection.target).attr("part-id"),
            type: CurrentConnection.scope
        });
    });
    return connections;
}

DesignMenu.prototype.getDesignParts = function() {
    var parts = []
    $(".node").each(function (idx, elem) {
        var $elem = $(elem);
        parts.push({
            partID: $elem.attr('part-id'),
            partName: $elem.attr('part-name'),
            positionX: parseInt($elem.css("left"), 10),
            positionY: parseInt($elem.css("top"), 10)
        });
    });
    return parts;
}

DesignMenu.prototype.enableLoadCircuitchartBtn = function(curcuitChart) {
    var that = this;
    this.openFileBtn.click(function() {
    	var curcuitChart = {"parts":[{"partID":"Cl_1","partName":"Cl","positionX":185,"positionY":110},{"partID":"Pcl_2","partName":"Pcl","positionX":305,"positionY":121}],"title":"curcuit1","relationship":[{"start":"Cl_1","end":"Pcl_2","type":"inhibition"}],"interfaceA":"Pcl_1","interfaceB":"cl_1"};
        var parts = curcuitChart.parts;
        var connections = curcuitChart.relationship;

        var nodeElems = that._loadCircuitCNodes(parts);
        that._loadCircuitLinks(connections, nodeElems);

        //update id
            //     partCount += 1;
            // div.attr("part-id", elem.partName + "_" + String(partCount));
    });

};

DesignMenu.prototype._loadCircuitCNodes = function(parts) {
    var nodeElems = [];
    var that = this;
    $.each(parts, function(index, elem ) {
        var node = that._createNewCNode(elem);
        node.appendTo(design.drawArea);

        design.addDraggable(node);
        design.addProAndInhibitLine(node);
        design.makeSourceAndTarget(node);

        // putPartElemList.push(div);
        var partID = elem.partID;
        nodeElems.push([partID, node]);
    });

    return nodeElems;
};

DesignMenu.prototype._createNewCNode = function(elem) {
    var node = $("<div></div>");
    var left = elem.positionX;
    var top = elem.positionY;
    node.css({left: left, top: top});
    node.css({position: "absolute"});
    node.attr("part-name", elem.partName);
    node.attr("normal-connect-num", 0);
    node.addClass("node");

//need debug
	var partType = DataManager.getPartType(elem.partName)
    var img = Util.createImageDiv(partType);
    img.appendTo(node);

    var titleDiv = Util.createTitleDiv(elem.partName);
    titleDiv.appendTo(node);

    var filterDiv = $("<div></div>");
    filterDiv.addClass("filterDiv");
    filterDiv.appendTo(node);

    var minusCircle = Util.createMinusCircleDiv();
    minusCircle.appendTo(node);

    return node;
};

DesignMenu.prototype._loadCircuitLinks = function(connections, nodeElems) {
    $.each(connections, function(index, elem) {
        // if (elem.type == "promotion" || elem.type == "inhibition") return;
        var startElem;
        var endElem;
        for (var index in nodeElems) {
            if (nodeElems[index][0] == elem.start) startElem = nodeElems[index][1];
            if (nodeElems[index][0] == elem.end) endElem = nodeElems[index][1];
        }
        var startNormalNum = parseInt($(startElem).attr("normal-connect-num"));
        var endNormalNum = parseInt($(endElem).attr("normal-connect-num"));
        startNormalNum += 1;
        endNormalNum += 1;
        $(startElem).attr("normal-connect-num", startNormalNum);
        $(endElem).attr("normal-connect-num", endNormalNum);

        design.drawLine(startElem, endElem, elem.type);
    }); 
};

DesignMenu.prototype.enableDownloadBtn =function() {
	var that = this;
	this.downloadBtn.click(function() {
		$('#downloadModal').modal("show");
	});

	$("#downloadsubmit").click(function() {
		$('#downloadModal').modal("hide");
		var curcuitChartData = that.getDesignChartData();
		var curcuitName = $("#curcuitDownName").val();
		curcuitChartData.title = curcuitName;
		Util.downloadFile(curcuitName+".txt", JSON.stringify(curcuitChartData));
		that.downloadChartAsImage(curcuitName);
	});
}

DesignMenu.prototype.downloadChartAsImage = function(curcuitName) {
    var el = $("#drawArea").get(0);
    console.log("test1");
    html2canvas(el, {
        onrendered: function(canvas) {
        	var that = this;
        	console.log("test2");
            this.canvas = document.createElement('canvas');
    		this.ctx = canvas.getContext('2d');
    		console.log("test");
            // # Render Flows/connections on top of same canvas
            this.flows =  $("> svg", el);

            this.flows.each(function() {
                var svg = $(this)
                var offset = svg.position();
                var svgStr = this.outerHTML;
                that.ctx.drawSvg(svgStr, offset.left, offset.top);
            });

            // var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            // Util.downloadImage(curcuitName+".png", image);
            // var dataURL = canvas.toDataURL();
            // console.log(dataURL);
            // ctx.getImageData()
            // $.ajax({
            //   type: "POST",
            //   url: "script.php",
            //   data: { 
            //      imgBase64: dataURL
            //   }
            // }).done(function(o) {
            //   console.log('saved'); 
            //   // If you want the file to be visible in the browser 
            //   // - please modify the callback in javascript. All you
            //   // need is to return the url to the file, you just saved 
            //   // and than put the image in your browser.
            // });
        }
    }); 
};

//========================================================================================
function SideBarWorker() {

}

SideBarWorker.prototype.createPartView = function(part) {
    var partName = part.name;
    var partType = part.type;
    var partIntro = part.introduction;
    var BBa = part.BBa;

    var dataDiv = $("<div class='data'></div>");
    var itemDiv = $("<div class='item'></div>");
    var imgElem = $("<img class='ui mini avatar image'/>");
    var titleSpan = $("<span class='title'></span>");
    var iconSpan = $('<span class="more"><i class="zoom icon"></i></span>');
    var BBaSpan = $("<span class='BBa'></span>");
    var leftSpan = $("<span class='leftBox'></span>");

    dataDiv.attr("type", partType);
	itemDiv.attr('id', partName);
	itemDiv.attr('part-type', partType);
    itemDiv.attr('part-name', partName);
    imgElem.attr("src", Util.getImagePath(partType, 60));
    titleSpan.text(partName);
    iconSpan.attr("data-content", "Read more about this part");
    iconSpan.popup();
    if (BBa != "") {
	    BBaSpan.text("("+BBa+")");
    }

    itemDiv.append(imgElem);
    itemDiv.append(titleSpan);
	leftSpan.append(itemDiv);
	leftSpan.append(BBaSpan);
	dataDiv.append(leftSpan);
	dataDiv.append(iconSpan);

    this._makeItJqueryDraggable(itemDiv);

    return dataDiv;
}

SideBarWorker.prototype.addElemToView = function(elem, view) {
    view.append(elem);
    this._makeItJqueryDraggable(elem.find('.item'));
    view.append(Util.createDivider());
    // console.log("addElemToView function");
}

SideBarWorker.prototype.showView = function(elemsPartList, view) {
    view.empty();
    for (var i in elemsPartList) {
        this.addElemToView(elemsPartList[i], view);
    }
}

SideBarWorker.prototype._makeItJqueryDraggable = function(elem) {
	// console.log("_makeItJqueryDraggable function");
    elem.draggable({
        helper: 'clone',
        cursor: 'move',
        tolerance: 'fit',
        revert: true
    });
}
/**
 * @class LeftBar
 *
 * @method constructor
 *
 */
function LeftBar() {
    this.isOpenLeftBar = false;
    this._leftBarWidth = 400;
    this.view = $("#left-sidebar");
    this.leftTrigger = $(".trigger-left");

    this.view.parts = $("#parts");
    this.view.devices = $("#devices");
    this.view.customs = $("#customs");
    // this.vide.systems = $("#systems");
    this.view.relates = $("#relates");
    this.view.relateParts = $("#relateParts");
    this.view.relateDevices = $("#relateDevices");
    this.view.relateSystems = $("#relateSystems");

    this._searchTitle = [];
    this.elemsPartList = [];
    this.elemsDeviceList = [];
    this.elemsSystemList = [];
    this.elemsCustomList = [];
    //test
    this.elemsPromoterList = [];
    this.elemsRBSList = [];
    this.elemsProteinList = [];
    this.elemsGeneList = [];
    this.elemsTermiList = [];
    this.elemsChemList = [];

    this.view.searchRelateBox = $("#searchRelate");
    this.view.searchNewBox = $("#searchNew");

    this.leftbarWorker = new SideBarWorker();
}

LeftBar.prototype.init = function() {
    this._leftTriggerAnimation();
    this.enableSearchNewBox();
    this.enableSearchRelateBox();
    $('.ui.styled.accordion').accordion({performance: true});
    $('.menu .item').tab();

    this.enableFilter();
};

LeftBar.prototype.initPart = function(partList) {
    //create left-bar data list
    var that = this;
    for (var i in partList) {
    	var dataDiv = this.leftbarWorker.createPartView(partList[i]);
    	this.elemsPartList.push(dataDiv);
	    this.addElemToBar(dataDiv);
    	this._searchTitle.push({title: partList[i].name});
    }
    this.updateSearchBar();
}

LeftBar.prototype.addElemToBar = function(elem) {
	var partType = elem.attr("type");
	var elemClone = elem.clone();
	this.leftbarWorker._makeItJqueryDraggable(elemClone.find(".item"));
	elemClone.find(".more").popup();
	if (partType == 'promoter' || partType == 'promotor') {
		this.elemsPromoterList.push(elemClone);
	}
	if (partType == 'RBS') {
		this.elemsRBSList.push(elemClone);
	}
	if (partType == 'protein') {
		this.elemsProteinList.push(elemClone);
	}
	if (partType == 'gene') {
		this.elemsGeneList.push(elemClone);
	}
	if (partType == 'terminatator' ||　partType == 'terminator'　|| partType == 'termintator') {
		this.elemsTermiList.push(elemClone);
	}
	if (partType == 'chemical' || partType == 'material' || partType == 'unknown' || partType == 'RNA') {
		this.elemsChemList.push(elemClone);
	}

	this.leftbarWorker.addElemToView(elem, this.view.parts);
}

LeftBar.prototype.enableFilter = function() {
	var that = this;
	$("#filterParts").change(function() {
		var partType = $(this).val();
		if (partType == 'promoter' || partType == 'promotor') {
			that.leftbarWorker.showView(that.elemsPromoterList, that.view.parts);
		}
		if (partType == 'RBS') {
			that.leftbarWorker.showView(that.elemsRBSList, that.view.parts);
		}
		if (partType == 'protein') {
			that.leftbarWorker.showView(that.elemsProteinList, that.view.parts);
		}
		if (partType == 'gene') {
			that.leftbarWorker.showView(that.elemsGeneList, that.view.parts);
		}
		if (partType == 'terminatator' ||　partType == 'terminator'　|| partType == 'termintator') {
			that.leftbarWorker.showView(that.elemsTermiList, that.view.parts);
		}
		if (partType == 'chemical' || partType == 'material' || partType == 'unknown' || partType == 'RNA') {
			that.leftbarWorker.showView(that.elemsChemList, that.view.parts);
		}
		if (partType == 'all') {
			that.leftbarWorker.showView(that.elemsPartList, that.view.parts);
		}
	})
}

LeftBar.prototype.addCustomPart = function(part) {
	var dataDiv = this.leftbarWorker.createPartView(part);
   	this.elemsCustomList.push(dataDiv);
   	this._searchTitle.push({title: part.name});

   	this.updateSearchBar();
    this.leftbarWorker.addElemToView(dataDiv, this.view.customs);
}

LeftBar.prototype.updateSearchBar = function() {
	$('.ui.search').search({source: this._searchTitle});
    // this.view.searchRelateBox.search({source: this._searchTitle});
}

LeftBar.prototype._leftTriggerAnimation = function() {
    var that = this;
    this.leftTrigger.click(function() {
        var left = that.view.css("left");
        if (parseInt(left) == 0) {
            that.isOpenLeftBar = false;
            that.view.animate({
                left: '-' + that._leftBarWidth + 'px'
            }, 500);

            $("#main-contain").animate({
                left: '0px'
            }, 500);
            that.leftTrigger.find("i").removeClass("left").addClass("right");
        } else {
            that.isOpenLeftBar = true;

            that.view.animate({
                left: '0px'
            }, 500);

            $("#main-contain").animate({
                left: that._leftBarWidth + 'px'
            }, 500);

            that.leftTrigger.find("i").removeClass("right").addClass("left");
        }
    });
}

LeftBar.prototype.enableSearchNewBox = function() {
    var that = this;
    this.view.searchNewBox.keyup(function() {
    	that.updateSearchBar();
    	var val = that.view.searchNewBox.val().toLowerCase();
        if (val != "") {
        	var searchElemPartList = [];
        	for (var i in that.elemsPartList) {
        		var partName = $(that.elemsPartList[i].find("div")[0]).attr("part-name").toLowerCase();
        		if (partName.indexOf(val) != -1) {
        			searchElemPartList.push(that.elemsPartList[i]);
        		}
        	}

        	that.leftbarWorker.showView(searchElemPartList, that.view.parts);
        } else {
        	that.leftbarWorker.showView(that.elemsPartList, that.view.parts);
        }
    });
};

LeftBar.prototype.enableSearchRelateBox = function() {
	var that = this;
	this.view.searchRelateBox.keyup(function() {
		var val = that.view.searchRelateBox.val().toLowerCase();
		console.log(that.view.searchRelateBox.val());
		if (val != "") {
			var searchElemPartList = [];
			for (var i in that.elemsPartList) {
				var partName = $(that.elemsPartList[i].find("div")[0]).attr("part-name").toLowerCase();
				if (DataManager.isRelate(val, partName)) {
					searchElemPartList.push(that.elemsPartList[i]);
				}
			}

			console.log("enableSearchRelateBox function");
			console.log(searchElemPartList);
			console.log(that.elemsPartList);
			console.log(that.view.relates);
			that.leftbarWorker.showView(searchElemPartList, that.view.relates);
		} else {
			that.view.relates.empty();
			that.view.relates.prev().removeClass("active");
			that.view.relates.removeClass("active");
		}
	})
}
//========================================================================================
/**
 * @class RightBar
 *
 * @method constructor
 *
 */
function RightBar() {
    this.rightTrigger = $(".trigger-right");
    this.view = $("#right-sidebar");
    this._isOpenRightBar = false;
    this._rightBarWidth = 400;

    this.elemsPartList = [];
    this.elemsDeviceList = [];
    this.elemsSystemList = [];
    this.elemsCustomList = [];

    this.view.parts = $("#addedParts");
    this.view.devices = $("#addedDevices");
    this.view.systems = $("#addedSystems");
    this.view.customs = $("#addedCustoms");
    this.view.searchAddBox = $("#searchAdd");

    this.rightbarWorker = new SideBarWorker();
    this._searchTitle = [];
};

RightBar.prototype.init = function() {
    this._rightTriggerAnimation();
    this.enableSearchAddBox();
}

RightBar.prototype._rightTriggerAnimation = function() {
    var that = this;
    this.rightTrigger.click(function() {
        var right = that.view.css("right");

        if (parseInt(right) == 0) {
            that._isOpenRightBar = false;
            that.view.animate({
                right: '-' + that._rightBarWidth + 'px'
            }, 500);

            that.view.find(".trigger-right > i").removeClass("right").addClass("left");
        } else {
            that._isOpenRightBar = true;

            that.view.animate({
                right: '0px'
            }, 500);
            
            that.view.find(".trigger-right > i").removeClass("left").addClass("right");
        }
    });
};

RightBar.prototype.processDropedPart = function(part) {
    this.updateEquationView(part);
    this.updateAddedView(part);
}

RightBar.prototype.updateEquationView = function(part) {
    if (this.isPartAddedEquationMenu(part)) {
        return;
    } else {
        this.addDropdownItem(part, $("#equationDropdownA .menu"))
        this.addDropdownItem(part, $("#equationDropdownB .menu"))
    }
}

RightBar.prototype.addDropdownItem = function(part, dropdownMenuElem) {
    var itemDiv = $("<div></div>");
    itemDiv.addClass("item");
    itemDiv.attr("data-value", part.name);

    var imgElem = $("<img/>");
    imgElem.addClass("ui mini avatar image");
    imgElem.attr("src", Util.getImagePath(part.type, 70));
    imgElem.appendTo(itemDiv);

    itemDiv.append(part.name);
    dropdownMenuElem.append(itemDiv);
}

RightBar.prototype.isPartAddedEquationMenu = function(part) {
    var flag = false;
    $("#equationDropdownA .menu").each(function() {
        if ($(this).text() == part.name) {
            flag = true;
        }
    })
    return flag;
}

RightBar.prototype.updateAddedView = function(part) {
    var partElem = this.rightbarWorker.createPartView(part);
    if (!this.isPartAdded(part)) {
        this.elemsPartList.push(partElem);
        this._searchTitle.push({title: part.name});
        this.updateSearchBar();
        this.rightbarWorker.showView(this.elemsPartList, this.view.parts);
    }
}

RightBar.prototype.isPartAdded = function(part) {
    for (var i in this.elemsPartList) {
        if ($(this.elemsPartList[i]).find("h4").text() == part.name) {
            return true;
        }
    }
    return false;
}

RightBar.prototype.updateSearchBar = function() {
    this.view.searchAddBox.search({source: this._searchTitle});
}

RightBar.prototype.enableSearchAddBox = function() {
    var that = this;
    this.view.searchAddBox.keyup(function() {
    	var val = that.view.searchAddBox.val().toLowerCase();
        if (val != "") {
        	var searchElemPartList = [];
        	for (var i in that.elemsPartList) {
        		var partName = $(that.elemsPartList[i].find("div")[0]).attr("part-name").toLowerCase();
        		if (partName.indexOf(val) != -1) {
        			searchElemPartList.push(that.elemsPartList[i]);
        		}
        	}
        	if (searchElemPartList !== []) {
				that.view.parts.prev().addClass("active");
				that.view.parts.addClass("active");
			}
        	that.rightbarWorker.showView(searchElemPartList, that.view.parts);
        } else {
        	that.rightbarWorker.showView(that.elemsPartList, that.view.parts);
        }
    });
};

RightBar.prototype.showEquation = function(partNameA, partNameB) {
    var equation = DataManager.getEquation(partNameA, partNameB);
    console.log(equation);
    var equationStr = Util.renderEquation(equation);
    var pElem = $("<p></p>");
    pElem.text(equationStr);
    $("#showEquation").append(pElem);
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

//===============================================================================
//===============================================================================

$(function() {
    design = new Design();
    leftBar = new LeftBar();
    rightBar = new RightBar();
    rubberband = new Rubberband();
    operationLog = new OperationLog();
    designMenu = new DesignMenu();
    operationLog.init();
    design.init();
    leftBar.init();
    rightBar.init();
    rubberband.init();
    designMenu.init();
    DataManager.getPartDataFromServer(function(partList) {
    	leftBar.initPart(partList);
    });
    DataManager.getDeviceDataFromServer(function(deviceList) {
    	leftBar.initDevice(deviceList);
    });
    DataManager.getRelationAdjDataFromServer();
    DataManager.getRelationShipDataFromServer();


})


//===============================================================================
//===============================================================================
//===============================================================================
//===============================================================================

$("#createCustomPart").click(function() {
	$('#createCustomPartModal').modal("show");
})

$('.dropdown').dropdown();

$(".cancel").each(function() {
	$(this).click(function() {
		$('.modal').modal("hide");
	});
});

$("#customPartType").change(function() {
	var partType = $(this).attr("value");
	$("#customImg").attr("src", "/static/img/design/"+partType+"_70.png");
});

$("#customCreate").click(function() {
	$('#createCustomPartModal').modal("hide");
	var part = {};
	part.name = $("#customPartName").val();
	console.log(part.name);
	part.type = $("#customPartType").val();
	part.introduction = $("#customIntro").val();
	leftBar.addCustomPart(part);

});

$("#equationPartA").change(function() {
    var partNameA = $(this).attr("value");
    var partNameB = $("#equationPartB").attr("value");
    console.log(partNameA);
    console.log(partNameB);
    if (partNameA != "" && partNameB != "") {
        rightBar.showEquation(partNameA, partNameB);
    }
});

$("#equationPartB").change(function() {
    var partNameA = $("#equationPartA").attr("value");
    var partNameB = $(this).attr("value");
    if (partNameA != "" && partNameB != "") {
        rightBar.showEquation(partNameA, partNameB);
    }
});


$(function() {
	dfs = new DFS();
	$("#searchCircuit").click(function() {
		dfs.createMap();
		dfs.searchCircuit();
	});
})

