/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"i2d/mpe/operations/manages1/model/formatter",
	"sap/ui/model/resource/ResourceModel",
	"sap/i2d/mpe/lib/commons1/fragments/HoldMessageStrip",
	"sap/i2d/mpe/lib/commons1/fragments/ReleaseHoldDialog",
	"sap/i2d/mpe/lib/commons1/utils/formatter",
	"sap/ui/model/json/JSONModel"
], function(Controller, Filter, formatter, ResourceModel, HoldMessageStrip, ReleaseHoldDialog, commonsFormatter, JSONModel) {
	"use strict";

	return Controller.extend("i2d.mpe.operations.manages1.blocks.IssuesBlockController", {
		formatter: formatter,
		commonsFormatter: commonsFormatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onInit: function() {
			var oI18NModel = this.loadI18NFile();
			this.getView().setModel(oI18NModel, "i18nCommon");
			
			var oEventBusParams = {
				ReleaseHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages1",
					Event: "onReleaseHoldSuccessfullyApplied",
					Callback: this.onReleaseHoldSuccessfullyComplete
				}
			};
			var oEventBus = sap.ui.getCore().getEventBus();
			this.setEventBusParameters(oEventBus, oEventBusParams.ReleaseHoldDialog.Channel,
				oEventBusParams.ReleaseHoldDialog.Event);
		},

		loadI18NFile: function() {
			var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
			return new ResourceModel({
				bundleUrl: sI18NFilePath
			});
		},

		getI18NCommonText: function(isKey, aValues) {
			return this.getView().getModel("i18nCommon").getResourceBundle().getText(isKey, aValues);
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onBeforeRendering: function() {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onAfterRendering: function() {},

		/** 
		 * Handler that determines the data received, so that executes the forther logic 
		 * @param OrderInternalBillOfOperations - The Routing number of operations in the order
		 * @param OrderIntBillOfOperationsItem -General counter for order
		 */
		getCompositeKey: function(OrderInternalBillOfOperations, OrderIntBillOfOperationsItem) {
			if (OrderInternalBillOfOperations && OrderIntBillOfOperationsItem) {
				this.onHandleInitComponentsTable();
			}
		},

		/** 
		 * Gets the model instance and calls _handleIsuesValue method to get the list of issues
		 */
		onHandleInitComponentsTable: function() {
			var oModel = this.getView().getModel("DetailModel");
			var oOperationDetailData = oModel.getData();

			var Operationid = oOperationDetailData.orderId;
			this.OrderInternalBillOfOperations = oOperationDetailData.sOrderInternalBillOfOperations;
			this.OrderIntBillOfOperationsItem = oOperationDetailData.sOrderIntBillOfOperationsItem;

			var oParentModel = this.oParentBlock.getModel();
			var sPath = this.oParentBlock.getModel().oData[Operationid];

			//this._handleIsuesValue(oParentModel, sPath);
			var oHoldModel = this.getView().getModel("HoldModel");
			this._handleIsuesValue(oParentModel, oHoldModel, sPath, this);
		},

		onPressReleaseHold: function(oControlEvent) {
			var sProductionHold = oControlEvent.getSource().data("ProductionHold");
			ReleaseHoldDialog.initAndOpen(this.getView().getModel("HoldModel"), sProductionHold);

			// Set parameters for event bus
			var oEventBusParams = this.getEventBusParameters();
			var oEventBus = sap.ui.getCore().getEventBus();
			ReleaseHoldDialog.setEventBusParameters(oEventBus, oEventBusParams.ReleaseHoldDialog.Channel,
				oEventBusParams.ReleaseHoldDialog.Event);
		},

		/** 
		 * Calls the oModel.read service to get the missing components
		 * Calculates the other issues also.
		 * @param oModel - The model bound to the parent block.
		 * @param sPath - The path with respect to the operation Id selected.
		 */
		_handleIsuesValue: function(oModel, oHoldModel, sPath, oIssuesBlock) {

			var oObjectPageLayout = formatter.getObjectPageLayoutReference();
			var oManufacturingOrder = sPath.ManufacturingOrder;
			var oManufactOrderSeq = sPath.ManufacturingOrderSequence;
			var oManufactOrderOperat = sPath.ManufacturingOrderOperation;
			var sResourcsPath = this.oParentBlock.getModel("i18n");
			var sMissingCompMessage = this.byId("idMissingComponents");
			var sQltyMessage = this.byId("idQltyIssue");
			var sQtyMessage = this.byId("idQtyIssue");
			var sDelayMessage = this.byId("idDelay");
			var sQualityIssueScrap;
			var sQualityIssueRejection;
			sMissingCompMessage.setVisible(false);
			sQltyMessage.setVisible(false);
			sQtyMessage.setVisible(false);
			sDelayMessage.setVisible(false);
			sQltyMessage.destroyLink();

			//hold
			//	var oHoldModel = this.getView().getModel("HoldModel");

			//	if (sPath.OperationHasProductionHold) {
			var oHoldObject = {
				ManufacturingOrder: sPath.ManufacturingOrder,
				ProductionPlant: sPath.ProductionPlant,
				Material: sPath.Material,
				WorkCenterInternalID: sPath.WorkCenterInternalID,
				OrderInternalBillOfOperations: sPath.OrderInternalBillOfOperations,
				OrderIntBillOfOperationsItem: sPath.OrderIntBillOfOperationsItem
			};

			var bPEOFeatureAvailable = formatter.getFeatureAvailability(sPath.MfgFeatureIsActiveInAnyPlant);
			if(bPEOFeatureAvailable){
				HoldMessageStrip.loadHoldsOperation(oModel, oHoldObject, this.getView().byId("holdMessages"));
			} else {
				var oHoldMessageStrip = this.getView().byId("holdMessages");
				oHoldMessageStrip.setModel(new JSONModel([]), "holds");
			}
			if(sPath.OperationHasMissingComponents){
				sMissingCompMessage.setVisible(true);
			}
			
			//	}

			// if (sPath.OperationHasMissingComponents && !sPath.ReservationIsFinallyIssued) {
			// 	var oOrderFilter = new Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, oManufacturingOrder);
			// 	var oSeqFilter = new Filter("ManufacturingOrderSequence", sap.ui.model.FilterOperator.EQ, oManufactOrderSeq);
			// 	var oOperationFilter = new Filter("ManufacturingOrderOperation", sap.ui.model.FilterOperator.EQ, oManufactOrderOperat);
			// 	var aFilters = [oOrderFilter, oSeqFilter, oOperationFilter];
			// 	var that = this;
			// 	// if the flag is true, we do an oModel.read to get the missing components and the value.	
			// 	oModel.read("/C_Operationcomponents", {
			// 		filters: aFilters,
			// 		success: $.proxy(function(oData) {
			// 			if (oData.results) {
			// 				that.aMaterialArray = [];
			// 				var aMissingComponents = [];
			// 				for (var iCountResult = 0; iCountResult < oData.results.length; iCountResult++) {
			// 					if (oData.results[iCountResult].MaterialComponentIsMissing && !(oData.results[iCountResult].ReservationIsFinallyIssued)) {
			// 						var oMaterial = oData.results[iCountResult].Material;
			// 						var oMissingQty = oData.results[iCountResult].MissingQuantity;
			// 						aMissingComponents.push({
			// 							material: oMaterial,
			// 							MissingQty: oMissingQty
			// 						});
			// 					}
			// 				}
			// 				aMissingComponents.sort(function(oFirstComponent, oSecondComponent) {
			// 					return oSecondComponent.MissingQty - oFirstComponent.MissingQty;
			// 				});

			// 				if (aMissingComponents.length === 1) {
			// 					this.aMaterialArray.push(aMissingComponents[0].material);
			// 				} else if (aMissingComponents.length > 1) {
			// 					this.aMaterialArray.push(aMissingComponents[0].material + " +" + (aMissingComponents.length - 1) + " " + sResourcsPath.getProperty(
			// 						"More"));
			// 				}

			// 			}
			// 			//displaying the missing components as links
			// 			var oLink = new sap.m.Link({
			// 				text: this.aMaterialArray,
			// 				press: function() {
			// 					//on click of the missing components,it scrolls to the components section with the missing components button enabled 
			// 					var aSections = oObjectPageLayout.getSections();
			// 					if (aSections && aSections.length > 2) {
			// 						var aSubSections = aSections[2].getSubSections();
			// 						if (aSubSections && aSubSections.length > 0) {
			// 							var aBlocks = aSubSections[0].getBlocks();
			// 							if (aBlocks && aBlocks.length > 0)

			// 							{
			// 								var oBlockView = sap.ui.getCore().byId(aBlocks[0].getSelectedView());
			// 								oBlockView.byId("btnSegmntComponents").setSelectedButton(oBlockView.byId("btnSegmntComponents").getButtons()[2]);
			// 								oBlockView.byId("btnSegmntComponents").fireSelect();
			// 							}
			// 						}
			// 						oObjectPageLayout.scrollToSection(oObjectPageLayout.getSections()[2].getId());
			// 					}

			// 				}
			// 			});
			// 			sMissingCompMessage.setVisible(true);
			// 			sMissingCompMessage.setLink(oLink);
			// 		}, this),
			// 		error: $.proxy(function(results) {}, this)
			// 	});
			// }
			//Checking for the Quality Issue and calculating the % scrap value
			if (sPath.OperationHasScrapQualityIssue === "X") {
				var oConfirmScrapQty = sPath.OpTotalConfirmedScrapQty;
				var oTotalPlanQty = sPath.OpPlannedTotalQuantity;
				if (oConfirmScrapQty !== 0 && oTotalPlanQty !== 0) {
					var iQltyPercentValue = Math.round((oConfirmScrapQty / oTotalPlanQty) * 100);
				}
				sQualityIssueScrap = "X";
			}
			if (sPath.InspHasRejectedCharc === "X" || sPath.InspHasRejectedInspSubset === "X" || sPath.InspHasRejectedInspLot === "X") {
				var sInspLotOp = this.getI18NCommonText("ConcatWithHyphen", [sPath.InspectionLot, sPath.ManufacturingOrderOperation]);
				var aInspectionLot = [sInspLotOp];
				var oQltyLink = new sap.m.Link({
					text: aInspectionLot,
					press: function() {
						//on click of the quality issues,it scrolls to the inspection lot section 
						var aSectionsq = oObjectPageLayout.getSections();
						if (aSectionsq && aSectionsq.length > 1) {
							oObjectPageLayout.scrollToSection(oObjectPageLayout.getSections()[5].getId());
						}
					}
				});
				sQualityIssueRejection = "X";
			}
			if (sQualityIssueScrap === "X") {
				if (sQualityIssueRejection === "X") {
					sQltyMessage.setVisible(true);
					sQltyMessage.setLink(oQltyLink);
					sQltyMessage.setText(this.getI18NCommonText("OpQualityDeviationScrapAndQM", [iQltyPercentValue]));
				} else {
					sQltyMessage.setVisible(true);
					sQltyMessage.setText(this.getI18NCommonText("QualityDeviationScrap", [iQltyPercentValue]));
				}
			} else {
				if (sQualityIssueRejection === "X") {
					sQltyMessage.setVisible(true);
					sQltyMessage.setLink(oQltyLink);
					sQltyMessage.setText(this.getI18NCommonText("OpQualityDeviationQM"));
				}
			}

			//checking for the Quantity issue
			if (sPath.OperationYieldDeviationQty < 0) {
				var oMissingQty = sPath.MissingQuantity;
				var oQtyUnit = sPath.OperationUnit;
				sQtyMessage.setVisible(true);
				sQtyMessage.setText(sResourcsPath.getProperty("QuantityDeviation") + " : " + oMissingQty + " " + oQtyUnit);
			}
			//checking for the delay issue and calculating interms of days , hours and minutes
			if (sPath.OperationExecutionEndIsLate || sPath.OperationExecutionStartIsLate) {
				var oOPerationEnd = sPath.ExecutionEndLatenessInMinutes;
				var oOPerationStart = sPath.ExecutionStartLatenessInMins;
				var iOpEnd = Math.round(oOPerationEnd);
				var iOpStrt = Math.round(oOPerationStart);
				if (iOpEnd > iOpStrt) {
					var iDelay = iOpEnd;
				} else {
					iDelay = iOpStrt;
				}
				iDelay = iDelay / (24 * 60) + ":" + iDelay / 60 % 24 + ":" + iDelay % 60;
				if (parseInt(iDelay.split(":")[0]) !== 0) {
					var iDays = parseInt(iDelay.split(":")[0]) + sResourcsPath.getProperty("Days");
				} else {
					iDays = "";
				}
				if (parseInt(iDelay.split(":")[1]) !== 0) {
					var iHours = parseInt(iDelay.split(":")[1]) + sResourcsPath.getProperty("Hours");
				} else {
					iHours = "";
				}
				if (parseInt(iDelay.split(":")[2]) !== 0) {
					var iMin = parseInt(iDelay.split(":")[2]) + sResourcsPath.getProperty("Minutes");
				} else {
					iMin = "";
				}
				sDelayMessage.setVisible(true);
				sDelayMessage.setText(sResourcsPath.getProperty("OPerationDelayed") + " " + iDays + " " + iHours + " " + iMin);
			}

		},

		setEventBusParameters: function(oEventBus, sEventChannel, sEventId) {
			this.oEventBus = oEventBus;
			this.sDialogEventChannel = sEventChannel;
			this.sEventId = sEventId;
		},
		
		getEventBusParameters: function() {
			// define events' details here for which event bus will be subscribed
			var oEventBusParams = {
				ReleaseHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages1",
					Event: "onHoldSuccessfullyApplied",
					// Event: "onRelHoldSuccessfullyApplied",
					Callback: this._onReleaseHoldSuccessfullyComplete
				}
			};
			return oEventBusParams;
		},

		_onReleaseHoldSuccessfullyComplete: function(sChannelId, sEventId, oResponse) {
			if (oResponse.success) {
				if (this.oEventBus) {
				var oSuccessResponse = {
					success: true
				};
				}
				this.oEventBus.publish(this.sDialogEventChannel, this.sEventId, oResponse);
			} else {
				// var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				// sMessageText = oResponse.info;
				// this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, "Error", [MessageBox.Action.CLOSE], "ErrorOrderMSG", sFinalText,
				// 	bCompact);
				// this._oOperationOrderReleaseButton.setEnabled(false);
				// this._oHoldButton.setEnabled(true);
				// this._oEditButton.setEnabled(false);
			}
		}

	});

});