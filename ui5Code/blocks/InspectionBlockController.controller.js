/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/odata/type/Time","i2d/mpe/operations/manages1/model/formatter","sap/ui/model/Sorter","sap/ui/model/resource/ResourceModel"],function(C,T,f,S,R){"use strict";return C.extend("i2d.mpe.operations.manages1.blocks.InspectionBlockController",{formatter:f,onInit:function(){},onHandleRebindInspectionLotBlock:function(e){var m=this.getView().getModel("DetailModel");var o=m.getData();this.gsOrderId=o.orderId;var O=e.getSource().getModel().oData[this.gsOrderId];var M,s;if(O){M=O.ManufacturingOrder;s=O.ManufacturingOrderOperation;}if(o.selectedOrderData&&M===undefined&&s===undefined){M=o.selectedOrderData.ManufacturingOrder;s=o.selectedOrderData.ManufacturingOrderOperation;}var l=e.getParameter("bindingParams");var a=l.filters;var F=new sap.ui.model.Filter([],true);if(M){F.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder",sap.ui.model.FilterOperator.EQ,M));F.aFilters.push(new sap.ui.model.Filter("InspectionOperation",sap.ui.model.FilterOperator.EQ,s));a.push(F);}},handleInspectionLotSelect:function(e){var c=e.getParameter("listItem").getBindingContext().getObject();var p={"InspectionLot":c.InspectionLot,"InspectionOperation":c.InspectionOperation};var o=sap.ushell.Container.getService("CrossApplicationNavigation");o.toExternal({target:{semanticObject:"InspectionOperation",action:"display"},params:p});}});});
