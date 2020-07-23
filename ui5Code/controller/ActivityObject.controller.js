/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["i2d/mpe/operations/manages2/controller/BaseController","sap/ui/model/json/JSONModel","i2d/mpe/operations/manages2/model/formatter","i2d/mpe/operations/manages2/utility/InlineWorkInstructions"],function(B,J,f,I){"use strict";return B.extend("i2d.mpe.operations.manages2.controller.ActivityObject",{formatter:f,onInit:function(){var v=new J({busyIndicatorDelay:0,WIVisible:false,documentsCount:0,recordResults:false,busy:false,documents:[]});this.InlineWorkInstructions=new I(this);this.setModel(v,"activityObjectView");this.getRouter().getRoute("activityObject").attachPatternMatched(this._handleRouteMatched,this);},_handleRouteMatched:function(e){var o=e.getParameter("arguments").OpActyNtwkInstance;var O=e.getParameter("arguments").OpActyNtwkElement;this.iAppState=e.getParameter("arguments").iAppState;var t=this;this.getModel().metadataLoaded().then(function(){t._bindView(o,O);});},_bindView:function(o,O){var v=this.getModel("activityObjectView"),d=this.getModel();var k=d.createKey("C_ProcgExecOperationActivity",{OpActyNtwkInstance:o,OpActyNtwkElement:O});v.setProperty("/documents",[]);v.setProperty("/documentsCount",0);var K="/"+k;this.getView().bindElement({path:K,parameters:{expand:"to_MfgOrderDocInfoRecdObjLink,to_OperationActyPRTAssignment,to_OperationActivityComponent,to_ShopFloorItemAtOpActy"},events:{change:this._onBindingChange.bind(this,o,O),dataRequested:function(){v.setProperty("/busy",true);},dataReceived:function(D){this.getView().setModel(new sap.ui.model.json.JSONModel({to_OperationActyPRTAssignment:null}),"OA");var a=D.getParameter("data");this.instantiateInlineWIReuseComponent(a.MfgWorkInstructionContent,a.MfgWorkInstructionMode);var i=a.to_OperationActyPRTAssignment.length;while(i--){if(a.to_OperationActyPRTAssignment[i].ProdnRsceToolCategory==="D"){var t=this;var b=a.to_OperationActyPRTAssignment[i].ProductionResourceTool.split(" ");this.getModel("Documents").callFunction("/GetAllOriginals",{urlParameters:{Documentnumber:b[0],Documenttype:b[1],Documentpart:b[2],Documentversion:b[3]},success:function(F){F.results.forEach(function(e){e.URL=f.getURLForDocument(e);e.Source=t.getResourceBundle().getText("PRT");});var c=t.getModel("activityObjectView").getProperty("/documents");t.getModel("activityObjectView").setProperty("/documents",c.concat(F.results));t.getModel("activityObjectView").setProperty("/documentsCount",t.getModel("activityObjectView").getProperty("/documentsCount")+F.results.length);}});a.to_OperationActyPRTAssignment.splice(i,1);}}this.callResultRecording(a.OpActyNtwkInstance,a.OpActyNtwkElement);v.setProperty("/busy",false);}.bind(this)}});},instantiateInlineWIReuseComponent:function(h,m){if(h!==""&&h!==undefined){this.InlineWorkInstructions.instantiateReuseComponent(h);this.getModel("activityObjectView").setProperty("/WIVisible",true);if(m==="ADVANCED"){this.InlineWorkInstructions._initializeInlineEditingModel();}}else{this.getModel("activityObjectView").setProperty("/WIVisible",false);}},callResultRecording:function(O,a){var V,c;V=this.byId("idInspCharView");c=V.getController();var t=V.byId("idInspCharcsTable");c.setProperties(O,a,"","",t);c.refresh();},_onBindingChange:function(o,O){}});});
