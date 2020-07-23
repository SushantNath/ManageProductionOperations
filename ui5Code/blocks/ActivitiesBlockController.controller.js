/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["i2d/mpe/operations/manages2/controller/BaseController","sap/ui/model/odata/type/Time","i2d/mpe/operations/manages2/model/formatter","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/i2d/mpe/lib/workuicomps1/fragments/ChangeAlertComparisonDialog","sap/ui/model/json/JSONModel","sap/i2d/mpe/lib/commons1/utils/util","sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog","sap/i2d/mpe/lib/commons1/utils/constants","sap/i2d/mpe/lib/qmcomps1/util/Defects"],function(B,T,f,F,a,C,J,R,A,b,D){"use strict";return B.extend("i2d.mpe.operations.manages2.blocks.ActivitiesBlockController",{formatter:f,onInit:function(){var m=new J({showChangeAlertColumn:false,isActivityHoldEnabled:false,isDefectButtonEnabled:false});this.setModel(m,"customActyModel");this.getView().byId("idActivitiesSmartTable").setIgnoreFromPersonalisation("OperationActivityName,MfgOrderOperationText,OperationStatusText,ManufacturingOrder,WorkCenter,Material,ConfirmationScrapQuantity,WorkCenterText,OpActyNtwkGroupExternalID,OpPlannedYieldQuantity");this._DefectsClass=new D();},onPressDefectBtn:function(){var d=this.getModel().getObject(this.getView().getBindingContext().getPath());this._DefectsClass.setFilters(d.ManufacturingOrder,d.OrderIntBillOfOperationsItem);var s=this.getView().byId("idActivitiesBlockTable").getSelectedContexts();this._DefectsClass._OpActyNtwkInstance=s[0].getObject().OpActyNtwkInstance;this._DefectsClass._OpActyNtwkElement=s[0].getObject().OpActyNtwkElement;this._DefectsClass._OperationActivity=s[0].getObject().OperationActivity;this._DefectsClass._OperationActyVersionCounter=s[0].getObject().OperationActyVersionCounter;this._DefectsClass.initAndOpenDialog();},onHandleRebindActivitiesBlock:function(e){var m=this.getView().getModel("DetailModel");var o=m.getData();var O=o.orderId;var M,s;if(e.getSource().getModel().oData[O]){M=e.getSource().getModel().oData[O].ManufacturingOrder;s=e.getSource().getModel().oData[O].ManufacturingOrderOperation;}if(!M&&!s&&o.selectedOrderData){M=o.selectedOrderData.ManufacturingOrder;s=o.selectedOrderData.ManufacturingOrderOperation;}var c=this.getOwnerComponent().getComponentData();var S=c?c.startupParameters:null;var l=e.getParameter("bindingParams");var d=l.filters;var g=new F([],true);if(M){l.sorter.push(new sap.ui.model.Sorter("ManufacturingOrderOperation"));g.aFilters.push(new F("ManufacturingOrder",a.EQ,M));g.aFilters.push(new F("ManufacturingOrderOperation",a.EQ,s));if(S&&S.NetChangeAnalysisPath&&S.ChangeImpactRelevanceFlagIsSet){var n=decodeURIComponent(S.NetChangeAnalysisPath[0]);g.aFilters.push(new sap.ui.model.Filter("NetChangeAnalysisPath",sap.ui.model.FilterOperator.EQ,n));g.aFilters.push(new sap.ui.model.Filter("ChangeImpactRelevanceFlagIsSet",sap.ui.model.FilterOperator.EQ,true));}d.push(g);}l.sorter.push(new sap.ui.model.Sorter("OpActyNtwkSegmentType"));l.sorter.push(new sap.ui.model.Sorter("OANElementDisplaySqncNumber"));},handleActivitySelect:function(e){var o=e.getParameter("listItem").getBindingContext().getObject();var O=o.OpActyNtwkInstance;var i=o.OpActyNtwkElement;this.getRouter().navTo("activityObject",{OpActyNtwkInstance:O,OpActyNtwkElement:i},false);},onPressChangeAlertIcon:function(e){var o=e.getSource().getBindingContext().getObject();var c={OperationActy:o.OperationActivity,OperationActyVers:o.OperationActyVersionCounter,ManufacturingOrder:o.ManufacturingOrder,User:"",IsAckButtonRequired:false,Plant:o.ProductionPlant,Segment:o.OpActyNtwkSegmentType,WorkCenter:o.WorkCenter};C.displayChangeAlertComparison(c,this.getView(),this.getModel("CHANGEALERTS"));},onDataReceived:function(e){var s=e.getSource();var I=s.getTable().getItems();this.getModel("customActyModel").setProperty("/showChangeAlertColumn",false);for(var i=0;i<I.length;i++){var d=I[i].getBindingContext().getObject();if(d.OpActyChgAlertAcknIsRequired){this.getModel("customActyModel").setProperty("/showChangeAlertColumn",true);break;}}var o=sap.ui.getCore().byId(this.getOwnerComponent().createId("object")).getController();this._DefectsClass.setProperties(o,this.getView().getBindingContext());},onSelectionChangeOperationActTable:function(e){if(e.getSource().getSelectedItems().length>0){var c=false;var s=e.getSource().getSelectedContexts();for(var i=0;i<s.length;i++){var S=s[i].getObject();if(S.SASStatusCategory===3||S.SASStatusCategory===4){c=true;break;}}this.getView().getModel("customActyModel").setProperty("/isActivityHoldEnabled",!c);}else{this.getView().getModel("customActyModel").setProperty("/isActivityHoldEnabled",false);}if(s&&s.length===1){this.getView().getModel("customActyModel").setProperty("/isDefectButtonEnabled",true);}else{this.getView().getModel("customActyModel").setProperty("/isDefectButtonEnabled",false);}},onPressActivityHold:function(){var s=this.getView().byId("idActivitiesBlockTable").getSelectedContexts();var S=[];s.forEach(function(c){S.push({"OpActyNtwkInstance":c.getObject().OpActyNtwkInstance,"OpActyNtwkElement":c.getObject().OpActyNtwkElement,"ProductionPlant":c.getObject().ProductionPlant});});A.initAndOpen(undefined,this.getOwnerComponent().getModel("HoldModel"),[b.HOLD.TYPE_OA],S);}});});
