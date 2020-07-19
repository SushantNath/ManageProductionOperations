/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/type/Time",
	"i2d/mpe/operations/manages1/model/formatter",
	"sap/ui/model/Sorter",
	"sap/ui/model/resource/ResourceModel"
], function(Controller, Time, formatter, Sorter, ResourceModel) {
	"use strict";

	return Controller.extend("i2d.mpe.operations.manages1.blocks.InspectionBlockController", {
		
		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 */
		onInit: function() {},

		/** 
		 * Rebehind handler of the Inspectionlot smart table.
		 * method applies filters on smart table
		 * @param oEvent
		 */
		onHandleRebindInspectionLotBlock: function(oEvent) {
			var oModel = this.getView().getModel("DetailModel");
			var oOrderDetailData = oModel.getData();
			this.gsOrderId = oOrderDetailData.orderId;
			var oOrderValue = oEvent.getSource().getModel().oData[this.gsOrderId];
			var sManufacturingOrder,sManufacturingOrderOperation;
			if (oOrderValue) {
				sManufacturingOrder = oOrderValue.ManufacturingOrder;
				sManufacturingOrderOperation = oOrderValue.ManufacturingOrderOperation;
			}
			if (oOrderDetailData.selectedOrderData && sManufacturingOrder === undefined && sManufacturingOrderOperation === undefined) {
				sManufacturingOrder = oOrderDetailData.selectedOrderData.ManufacturingOrder;
				sManufacturingOrderOperation = oOrderDetailData.selectedOrderData.ManufacturingOrderOperation;
			}
			var lmBindingParams = oEvent.getParameter("bindingParams");
			var laFilters = lmBindingParams.filters;
			var oFilter = new sap.ui.model.Filter([], true);
			if (sManufacturingOrder) {
				oFilter.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, sManufacturingOrder));
				oFilter.aFilters.push(new sap.ui.model.Filter("InspectionOperation", sap.ui.model.FilterOperator.EQ, sManufacturingOrderOperation));
				laFilters.push(oFilter);
			}
		},

		/** 
		 * Inspection lot selection handler, which does a cross app navigation to the Inspection Lot App
		 * pass the InspectionLot & InspectionOperation as the parameters
		 * @param oEvent
		 */
		handleInspectionLotSelect: function(oEvent) {
			//navigation with hyperlink
			//var oCurrentInspection = oEvent.getSource().getBindingContext().getObject();
			//navigation with chevron
			var oCurrentInspection = oEvent.getParameter("listItem").getBindingContext().getObject();
			var oParameters = {
				"InspectionLot": oCurrentInspection.InspectionLot,
				"InspectionOperation": oCurrentInspection.InspectionOperation

			};
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "InspectionOperation",
					action: "display"
				},
				params: oParameters
			});
		}
	});

});