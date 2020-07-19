/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/resource/ResourceModel",
	"i2d/mpe/operations/manages1/model/formatter"

], function (Controller, ResourceModel, formatter) {
	"use strict";

	return Controller.extend("i2d.mpe.operations.manages1.blocks.ConfirmationBlockController", {
		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * 
		 */
		onInit: function () {
			this._osmartTable = this.getView().byId("idAllConfirmationTable");
			// ignoring fields from smart table personalisation
			this._osmartTable.setIgnoreFromPersonalisation("IsFinalConfirmation");
			var oI18NModel = this.loadI18NFile();
			this.getView().setModel(oI18NModel, "i18nCommon");
		},

		loadI18NFile: function () {
			var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
			return new ResourceModel({
				bundleUrl: sI18NFilePath
			});
		},

		getI18NCommonText: function (isKey, aValues) {
			return this.getView().getModel("i18nCommon").getResourceBundle().getText(isKey, aValues);
		},

		/** 
		 * Rebehind handler of the Confirmations smart table.
		 * method applies pre filters on smart table
		 * @param ioEvent
		 * @returns
		 */
		onHandleRebindAllConfirmationTable: function (ioEvent) {
			var oModel = this.getView().getModel("DetailModel");
			var oOrderDetailData = oModel.getData();
			this.gsOrderId = oOrderDetailData.orderId;
			var oOrderValue = ioEvent.getSource().getModel().oData[this.gsOrderId];
			var sManufacturingOrder;
			if (oOrderValue) {
				this.sOperationId = oOrderValue.ManufacturingOrderOperation;
				sManufacturingOrder = oOrderValue.ManufacturingOrder;
			}
			if (oOrderDetailData.selectedOrderData && sManufacturingOrder === undefined) {
				sManufacturingOrder = oOrderDetailData.selectedOrderData.ManufacturingOrder;
				this.sOperationId = oOrderDetailData.selectedOrderData.ManufacturingOrderOperation;
			}
			var oBindingParams = ioEvent.getParameter("bindingParams");
			if (oBindingParams.parameters !== undefined) {
				oBindingParams.parameters.select += ",MfgOrderConfirmationCount";
			}
			var aFilters = oBindingParams.filters;
			var oFilter = new sap.ui.model.Filter([], true);

			if (sManufacturingOrder) {
				oFilter.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, sManufacturingOrder));
				oFilter.aFilters.push(new sap.ui.model.Filter("ManufacturingOrderOperation", sap.ui.model.FilterOperator.EQ, this.sOperationId));
				aFilters.push(oFilter);
			}

		},

		/*
		 * On click of the confirmation item list
		 * Do a cross-app navigation to the Confirmation App
		 * Passing the OrderConfirmation adn Confirmation Count values
		 * @param oEvent
		 */

		handleConfirmationSelect: function (oEvent) {
			//navigation with hyperlink
			//var oConfirmationSelected = oEvent.getSource().getBindingContext().getObject();
			//navigation with chevron
			var oConfirmationSelected = oEvent.getSource().getSelectedItem().getBindingContext().getObject();
			var sConfirmation = oConfirmationSelected.MfgOrderConfirmation;
			var iConfirmationCount = oConfirmationSelected.MfgOrderConfirmationCount;
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var sPattern = "&/C_ProdOrdConfObjPg(ProductionOrderConfirmation='" + sConfirmation + "',OperationConfirmationCount='" +
				iConfirmationCount + "')";
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#ProductionOrderConfirmation-displayFactSheet" + sPattern
				}
			});
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * 
		 */
		onBeforeRendering: function () {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * 
		 */
		onAfterRendering: function () {},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 *
		 */
		onExit: function () {}
	});

});