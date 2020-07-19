/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/resource/ResourceModel","i2d/mpe/operations/manages1/model/formatter"],function(C,R,f){"use strict";return C.extend("i2d.mpe.operations.manages1.blocks.ConfirmationBlockController",{formatter:f,onInit:function(){this._osmartTable=this.getView().byId("idAllConfirmationTable");this._osmartTable.setIgnoreFromPersonalisation("IsFinalConfirmation");var i=this.loadI18NFile();this.getView().setModel(i,"i18nCommon");},loadI18NFile:function(){var i=jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1")+"/"+"i18n/i18n.properties";return new R({bundleUrl:i});},getI18NCommonText:function(i,v){return this.getView().getModel("i18nCommon").getResourceBundle().getText(i,v);},onHandleRebindAllConfirmationTable:function(i){var m=this.getView().getModel("DetailModel");var o=m.getData();this.gsOrderId=o.orderId;var O=i.getSource().getModel().oData[this.gsOrderId];var M;if(O){this.sOperationId=O.ManufacturingOrderOperation;M=O.ManufacturingOrder;}if(o.selectedOrderData&&M===undefined){M=o.selectedOrderData.ManufacturingOrder;this.sOperationId=o.selectedOrderData.ManufacturingOrderOperation;}var b=i.getParameter("bindingParams");if(b.parameters!==undefined){b.parameters.select+=",MfgOrderConfirmationCount";}var F=b.filters;var a=new sap.ui.model.Filter([],true);if(M){a.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder",sap.ui.model.FilterOperator.EQ,M));a.aFilters.push(new sap.ui.model.Filter("ManufacturingOrderOperation",sap.ui.model.FilterOperator.EQ,this.sOperationId));F.push(a);}},handleConfirmationSelect:function(e){var c=e.getSource().getSelectedItem().getBindingContext().getObject();var s=c.MfgOrderConfirmation;var i=c.MfgOrderConfirmationCount;var o=sap.ushell.Container.getService("CrossApplicationNavigation");var p="&/C_ProdOrdConfObjPg(ProductionOrderConfirmation='"+s+"',OperationConfirmationCount='"+i+"')";o.toExternal({target:{shellHash:"#ProductionOrderConfirmation-displayFactSheet"+p}});},onBeforeRendering:function(){},onAfterRendering:function(){},onExit:function(){}});});
