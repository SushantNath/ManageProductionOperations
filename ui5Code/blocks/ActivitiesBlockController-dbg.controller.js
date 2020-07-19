/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"i2d/mpe/operations/manages1/controller/BaseController",
	"sap/ui/model/odata/type/Time",
	"i2d/mpe/operations/manages1/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/i2d/mpe/lib/workuicomps1/fragments/ChangeAlertComparisonDialog",
	"sap/ui/model/json/JSONModel",
	"sap/i2d/mpe/lib/commons1/utils/util",
	"sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog",
	"sap/i2d/mpe/lib/commons1/utils/constants",
	"sap/i2d/mpe/lib/qmcomps1/util/Defects"
], function (BaseController, Time, formatter, Filter, FilterOperator, ChangeAlertComparisonDialog, JSONModel, ReuseUtil,
	ApplyHoldDialog, CommonsConstants, Defects) {
	"use strict";

	return BaseController.extend("i2d.mpe.operations.manages1.blocks.ActivitiesBlockController", {

		formatter: formatter,
		// _selectedActivities: [],
		onInit: function () {
			var oModel = new JSONModel({
				showChangeAlertColumn: false,
				isActivityHoldEnabled: false,
				isDefectButtonEnabled: false
			});
			this.setModel(oModel, "customActyModel");

			//hide fields from p13n dialog box
			this.getView().byId("idActivitiesSmartTable").setIgnoreFromPersonalisation(
				"OperationActivityName,MfgOrderOperationText,OperationStatusText,ManufacturingOrder,WorkCenter,Material,ConfirmationScrapQuantity,WorkCenterText,OpActyNtwkGroupExternalID,OpPlannedYieldQuantity"
			);
			this._DefectsClass = new Defects();
		},

		onPressDefectBtn: function () {
			var oData = this.getModel().getObject(this.getView().getBindingContext().getPath());
			this._DefectsClass.setFilters(oData.ManufacturingOrder, oData.OrderIntBillOfOperationsItem);
			var aSelectedContext = this.getView().byId("idActivitiesBlockTable").getSelectedContexts();
			this._DefectsClass._OpActyNtwkInstance = aSelectedContext[0].getObject().OpActyNtwkInstance;
			this._DefectsClass._OpActyNtwkElement = aSelectedContext[0].getObject().OpActyNtwkElement;
			this._DefectsClass._OperationActivity = aSelectedContext[0].getObject().OperationActivity;
			this._DefectsClass._OperationActyVersionCounter = aSelectedContext[0].getObject().OperationActyVersionCounter;
			this._DefectsClass.initAndOpenDialog();
		},

		/** 
		 * Rebehind handler of the Activities smart table.
		 * method applies filters on smart table
		 * @param oEvent
		 */
		onHandleRebindActivitiesBlock: function (oEvent) {
			var oModel = this.getView().getModel("DetailModel");
			var oOrderDetailData = oModel.getData();
			var sOrderId = oOrderDetailData.orderId;
			var sManufacturingOrder, sManufacturingOrderOperation;
			if (oEvent.getSource().getModel().oData[sOrderId]) {
				sManufacturingOrder = oEvent.getSource().getModel().oData[sOrderId].ManufacturingOrder;
				sManufacturingOrderOperation = oEvent.getSource().getModel().oData[sOrderId].ManufacturingOrderOperation;
			}
			if(!sManufacturingOrder && !sManufacturingOrderOperation && oOrderDetailData.selectedOrderData ) {
				sManufacturingOrder = oOrderDetailData.selectedOrderData.ManufacturingOrder;
				sManufacturingOrderOperation = oOrderDetailData.selectedOrderData.ManufacturingOrderOperation;
			}

			// Changes for Analyse change impact application: Highlight Impacted Activities 
			// if Operations detail page is launched from
			// Change impact application two parameters "NetchangeAnalysisPath" and "ChangeImpactRelevanceFlagIsSet" will be passed.

			// Reading startup parameters to get the NetchangeAnalysisPath and ChangeImpactRelevanceFlagIsSet
			var oComponentData = this.getOwnerComponent().getComponentData();
			var oStartupParameters = oComponentData ? oComponentData.startupParameters : null;

			var lmBindingParams = oEvent.getParameter("bindingParams");
			var laFilters = lmBindingParams.filters;
			var oFilter = new Filter([], true);
			if (sManufacturingOrder) {
				lmBindingParams.sorter.push( new sap.ui.model.Sorter("ManufacturingOrderOperation"));
				oFilter.aFilters.push(new Filter("ManufacturingOrder", FilterOperator.EQ, sManufacturingOrder));
				oFilter.aFilters.push(new Filter("ManufacturingOrderOperation", FilterOperator.EQ, sManufacturingOrderOperation));

				// Additional filters are passed only in the context of Analyse Change Impact scenario
				if (oStartupParameters && oStartupParameters.NetChangeAnalysisPath && oStartupParameters.ChangeImpactRelevanceFlagIsSet) {
					var sNetChangeAnalysisPath = decodeURIComponent(oStartupParameters.NetChangeAnalysisPath[0]);
					oFilter.aFilters.push(new sap.ui.model.Filter("NetChangeAnalysisPath", sap.ui.model.FilterOperator.EQ, sNetChangeAnalysisPath));
					oFilter.aFilters.push(new sap.ui.model.Filter("ChangeImpactRelevanceFlagIsSet", sap.ui.model.FilterOperator.EQ, true));
				}

				laFilters.push(oFilter);
			}

			lmBindingParams.sorter.push( new sap.ui.model.Sorter("OpActyNtwkSegmentType"));
			lmBindingParams.sorter.push( new sap.ui.model.Sorter("OANElementDisplaySqncNumber"));
			// this._selectedActivities = [];
		},

		/** 
		 * Activities selection handler, which does a cross app navigation to the Activity's Object Page
		 * @param oEvent
		 */
		handleActivitySelect: function (oEvent) {
			//navigation with chevron
			var oActivitySelected = oEvent.getParameter("listItem").getBindingContext().getObject();
			var sOpActyNtwkInstance = oActivitySelected.OpActyNtwkInstance;
			var iOpActyNtwkElement = oActivitySelected.OpActyNtwkElement;

			this.getRouter().navTo("activityObject", {
				OpActyNtwkInstance: sOpActyNtwkInstance,
				OpActyNtwkElement: iOpActyNtwkElement
			}, false);
		},

		/**
		 * Event Handler for Change Alert Icon in header
		 * Open change alert comparison dialog with no option to acknowledge
		 * @public
		 */
		onPressChangeAlertIcon: function (oEvent) {
			var oActivityObject = oEvent.getSource().getBindingContext().getObject();

			var oComparisonObject = {
				OperationActy: oActivityObject.OperationActivity,
				OperationActyVers: oActivityObject.OperationActyVersionCounter,
				ManufacturingOrder: oActivityObject.ManufacturingOrder,
				User: "", //  not mandatory field
				IsAckButtonRequired: false,
				Plant: oActivityObject.ProductionPlant,
				Segment: oActivityObject.OpActyNtwkSegmentType,
				WorkCenter: oActivityObject.WorkCenter
			};
			ChangeAlertComparisonDialog.displayChangeAlertComparison(oComparisonObject, this.getView(), this.getModel("CHANGEALERTS"));
		},

		onDataReceived: function (oEvent) {
			var oSmartTable = oEvent.getSource();
			var oItems = oSmartTable.getTable().getItems();

			this.getModel("customActyModel").setProperty("/showChangeAlertColumn", false);

			for (var i = 0; i < oItems.length; i++) {
				var oData = oItems[i].getBindingContext().getObject();
				if (oData.OpActyChgAlertAcknIsRequired) {
					this.getModel("customActyModel").setProperty("/showChangeAlertColumn", true);
					break;
				}
			}
			var oObjectController = sap.ui.getCore().byId(this.getOwnerComponent().createId("object")).getController();
			this._DefectsClass.setProperties(oObjectController, this.getView().getBindingContext());
		},

		onSelectionChangeOperationActTable: function (oEvent) {
			if (oEvent.getSource().getSelectedItems().length > 0) { // If any checkbox is selected
				var bActivityClosed = false;
				var aSelectedContext = oEvent.getSource().getSelectedContexts();
				// Loop on selected data to check if SASStatusCategory
				for (var i = 0; i < aSelectedContext.length; i++) {
					var oSelectedItemData = aSelectedContext[i].getObject();
					if (oSelectedItemData.SASStatusCategory === 3 || oSelectedItemData.SASStatusCategory === 4) {
						bActivityClosed = true;
						break;
					}
				}
				this.getView().getModel("customActyModel").setProperty("/isActivityHoldEnabled", !bActivityClosed);
			} else { // When no checkbox is selected
				this.getView().getModel("customActyModel").setProperty("/isActivityHoldEnabled", false);
			}

			if (aSelectedContext && aSelectedContext.length === 1) {
				this.getView().getModel("customActyModel").setProperty("/isDefectButtonEnabled", true);
			} else {
				this.getView().getModel("customActyModel").setProperty("/isDefectButtonEnabled", false);
			}
		},

		onPressActivityHold: function () {
			var aSelectedContext = this.getView().byId("idActivitiesBlockTable").getSelectedContexts();
			var aSelectedActivities = [];
			aSelectedContext.forEach(function (oContext) {
				aSelectedActivities.push({
					"OpActyNtwkInstance": oContext.getObject().OpActyNtwkInstance,
					"OpActyNtwkElement": oContext.getObject().OpActyNtwkElement,
					"ProductionPlant": oContext.getObject().ProductionPlant
				});

			});

			ApplyHoldDialog.initAndOpen(undefined, this.getOwnerComponent().getModel("HoldModel"), [CommonsConstants.HOLD.TYPE_OA],
				aSelectedActivities);
		}
	});
});