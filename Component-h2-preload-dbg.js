//@ui5-bundle i2d/mpe/operations/manages1/Component-h2-preload.js
/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.predefine('i2d/mpe/operations/manages1/Component',["sap/ui/core/UIComponent","sap/ui/Device","i2d/mpe/operations/manages1/model/models","i2d/mpe/operations/manages1/controller/ErrorHandler","sap/ui/core/routing/HashChanger"],function(U,D,m,E,H){"use strict";return U.extend("i2d.mpe.operations.manages1.Component",{metadata:{manifest:"json"},init:function(){U.prototype.init.apply(this,arguments);this._oErrorHandler=new E(this);this.setModel(m.createDeviceModel(),"device");this.setModel(m.createFLPModel(),"FLP");this.intializeAppState();this.setOperationDetailModel();this.bInitialRefreshLoadAppstate=true;this._oRouter=this.getRouter();this.oHashChanger=H.getInstance();var p=this.oHashChanger.getHash();if(p){if(p.indexOf("sap-iapp-state")>-1){this.sOldAppStateKey=p.split("sap-iapp-state=")[1];this._extractInnerAppStateFromKey(this.sOldAppStateKey);}else{this.sOldAppStateKey=this.getInnerAppStateKey();this.bInitialRefreshLoadAppstate=false;}if(p.indexOf("C_Manageoperations")>-1&&p.indexOf("sap-iapp-state")>-1){this._oRouter.initialize("true");this.addAppStateKey("object",p.split("/")[1]);}else if(p.indexOf("C_Manageoperations")===-1&&p.indexOf("sap-iapp-state")>-1){this._oRouter.initialize("true");this.addAppStateKey("worklist");}else{this._oRouter.initialize();}}else{this.sOldAppStateKey=this.getInnerAppStateKey();this.bInitialRefreshLoadAppstate=false;this._oRouter.initialize("true");this.addAppStateKey("worklist");}},_crossAppNavToDetail:function(v,r,o,h){var u;if(v==="worklist"){u=r.getURL("worklist",{iAppState:this.getInnerAppStateKey()});}else{u=r.getURL("object",{operationId:o,iAppState:this.getInnerAppStateKey()});}if(u){h.replaceHash(u);}},setOperationDetailModel:function(){var o=new sap.ui.model.json.JSONModel({});var O=o.getData();O.bEnableAutoBinding=true;o.setData(O);this.setModel(o,"DetailModel");},intializeAppState:function(){var c=this,C=sap.ushell.Container.getService("CrossApplicationNavigation");this.oCrossAppStatePromise=new jQuery.Deferred();this.oInnerAppStatePromise=new jQuery.Deferred();this.oAppStateModel=new sap.ui.model.json.JSONModel({appState:{variantId:"",VariantState:""}});this.setModel(this.oAppStateModel,"AppState");this.oNavTargetsModel=new sap.ui.model.json.JSONModel({toOurAppWithState:"",toOurAppNoState:""});this.setModel(this.oNavTargetsModel,"navTargets");this.oAppState=C.createEmptyAppState(this);this.calculateCrossAppLinks();C.getStartupAppState(this).done(function(s){c.updateModelFromAppstate(c.oAppStateModel,s);c.oCrossAppStatePromise.resolve();});this.oInnerAppStatePromise.done(function(){c.updateAppStateFromAppStateModel();});},extractInnerAppStateFromURL:function(i,c,p){var t=this;var l=i;if(this.bInitialRefreshLoadAppstate){l=this.sOldAppStateKey;this.bInitialRefreshLoadAppstate=false;}if(l===this.getInnerAppStateKey()){this.oInnerAppStatePromise.resolve();return;}t.createANewAppStateModel();this.oCrossAppStatePromise.done(function(){sap.ushell.Container.getService("CrossApplicationNavigation").getAppState(t,l).done(function(s){t.updateModelFromAppstate(t.oAppStateModel,s);t.oInnerAppStatePromise.resolve();});});t.oInnerAppStatePromise.done(function(){setTimeout(function(){t.addAppStateKey(c,p);},0);});},_extractInnerAppStateFromKey:function(i){var t=this;sap.ushell.Container.getService("CrossApplicationNavigation").getAppState(t,i).done(function(s){var d=t.getModel("DetailModel");if(s.getData()){d.setData(s.getData());}});},createANewAppStateModel:function(){this.oAppState=sap.ushell.Container.getService("CrossApplicationNavigation").createEmptyAppState(this);this.calculateCrossAppLinks();},getInnerAppStateKey:function(){return(this.oAppState&&this.oAppState.getKey())||" key not set yet ";},updateModelFromAppstate:function(M,a){var A=a.getData();if(A){var p=this.getRouter().oHashChanger.getHash();if(p.indexOf("C_Manageoperations")>-1){sap.ui.getCore().getEventBus().publish("AppState","hanldeAppstateDetailChanges",A.detailPage);}else{sap.ui.getCore().getEventBus().publish("AppState","handleAppstateChanges",A);}return true;}return false;},updateAppStateFromAppStateModel:function(){var d;d=this.oAppStateModel.getProperty("/appState");this.oAppState.setData(d);this.oAppState.save();},calculateCrossAppLinks:function(){var h,c=sap.ushell.Container.getService("CrossApplicationNavigation");h=c.hrefForExternal({target:{semanticObject:"ManufacturingOrderOperation",action:"manage"},params:{"VariantName":"One"},appStateKey:this.oAppState.getKey()},this)||"";this.oNavTargetsModel.setProperty("/toOurAppWithState",h);h=c.hrefForExternal({target:{semanticObject:"ManufacturingOrderOperation",action:"manage"},params:{"VarianName":"two"}})||"";this.oNavTargetsModel.setProperty("/toOurAppNoState",h);},addAppStateKey:function(c,p){if(this._oRouter){if(c==="worklist"){this._oRouter.navTo(c,{iAppState:this.getInnerAppStateKey()},true);}else{this._oRouter.navTo(c,{operationId:p,iAppState:this.getInnerAppStateKey()},true);}}},destroy:function(){this._oErrorHandler.destroy();U.prototype.destroy.apply(this,arguments);},getContentDensityClass:function(){if(this._sContentDensityClass===undefined){if(jQuery(document.body).hasClass("sapUiSizeCozy")||jQuery(document.body).hasClass("sapUiSizeCompact")){this._sContentDensityClass="";}else if(!D.support.touch){this._sContentDensityClass="sapUiSizeCompact";}else{this._sContentDensityClass="sapUiSizeCozy";}}return this._sContentDensityClass;}});});
sap.ui.require.preload({
	"i2d/mpe/operations/manages1/manifest.json":'{"_version":"1.9.0","sap.app":{"_version":"1.2.0","id":"i2d.mpe.operations.manages1","type":"application","resources":"resources.json","i18n":"i18n/i18n.properties","title":"{{appTitle}}","description":"{{appDescription}}","applicationVersion":{"version":"7.0.7"},"ach":"PP-FIO-SFC","dataSources":{"mainService":{"uri":"/sap/opu/odata/sap/PP_MPE_OPER_MANAGE/","type":"OData","settings":{"annotations":["mainAnnotationsSrv","annotation"],"odataVersion":"2.0","localUri":"localService/metadata.xml"}},"MPE_HOLD_SRV":{"uri":"/sap/opu/odata/sap/MPE_HOLD_SRV/","type":"OData","settings":{"odataVersion":"2.0","localUri":"webapp/localService/MPE_HOLD_SRV/metadata.xml"}},"mainAnnotationsSrv":{"uri":"/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Annotations(TechnicalName=\'PP_MPE_OPER_MANAGE_ANNO_MDL\',Version=\'0001\')/$value","type":"ODataAnnotation"},"AOR":{"uri":"/sap/opu/odata/sap/PP_MPE_AOR/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/PP_MPE_AOR/metadata.xml"}},"MaterialPopOver":{"uri":"/sap/opu/odata/sap/MPE_MATERIAL_POVER/","type":"OData","settings":{"odataVersion":"2.0","localUri":"webapp/localService/MPE_MATERIAL_POVER/metadata.xml"}},"MPE_PRODNORD_POVER":{"uri":"/sap/opu/odata/sap/MPE_PRODNORD_POVER/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/MPE_PRODNORD_POVER/metadata.xml"}},"MPE_PRODOPER_POVER":{"uri":"/sap/opu/odata/sap/MPE_PRODOPER_POVER/","type":"OData","settings":{"odataVersion":"2.0","localUri":"webapp/localService/MPE_PRODOPER_POVER/metadata.xml"}},"MPE_WORKCENTER_POVER":{"uri":"/sap/opu/odata/sap/MPE_WORKCENTER_POVER/","type":"OData","settings":{"odataVersion":"2.0","localUri":"webapp/localService/MPE_WORKCENTER_POVER/metadata.xml"}},"annotation":{"type":"ODataAnnotation","uri":"annotation/annotation.xml","settings":{"localUri":"annotation/annotation.xml"}},"MPE_OA_EXECUTION_SRV":{"uri":"/sap/opu/odata/sap/MPE_OA_EXECUTION_SRV/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/MPE_OA_EXECUTION_SRV/metadata.xml"}},"MPE_EXEC_RR_SRV":{"uri":"/sap/opu/odata/sap/MPE_EXEC_RR_SRV/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/MPE_EXEC_RR_SRV/metadata.xml"}},"QM_DEFECT_RECORD_SRV":{"uri":"/sap/opu/odata/SAP/MPE_EXEC_NON_CONFORMANCE_SRV/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/MPE_EXEC_NON_CONFORMANCE_SRV/metadata.xml"}},"MPE_CHANGE_RECORD_EXEC_SRV":{"uri":"/sap/opu/odata/sap/MPE_CHANGE_RECORD_EXEC_SRV/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/MPE_CHANGE_RECORD_EXEC_SRV/metadata.xml"}},"MPE_ORDER_SPECIFIC_ROUTING_SRV":{"uri":"/sap/opu/odata/sap/MPE_ORDER_SPECIFIC_ROUTING_SRV/","type":"OData","settings":{"odataVersion":"2.0","localUri":"localService/MPE_ORDER_SPECIFIC_ROUTING_SRV/metadata.xml"}},"MPE_DOCUMENT_LIST_SRV":{"uri":"/sap/opu/odata/sap/MPE_DOCUMENT_LIST_SRV/","type":"OData","settings":{"localUri":"localService/MPE_DOCUMENT_LIST_SRV/metadata.xml"}}},"sourceTemplate":{"id":"servicecatalog.connectivityComponentForManifest","version":"0.0.0"}},"sap.platform.abap":{"_version":"1.2.0","uri":"/sap/bc/ui5_ui5/sap/MPE_OPER_MANS1"},"sap.fiori":{"_version":"1.1.0","registrationIds":["F2335"],"archeType":"transactional"},"sap.ui":{"_version":"1.2.0","technology":"UI5","icons":{"icon":"sap-icon://task","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true},"supportedThemes":["sap_hcb","sap_bluecrystal"]},"sap.ui5":{"_version":"1.2.0","rootView":{"viewName":"i2d.mpe.operations.manages1.view.App","type":"XML","id":"app"},"dependencies":{"minUI5Version":"1.65.5","libs":{"sap.ui.core":{"minVersion":"1.38.0","lazy":false},"sap.m":{"minVersion":"1.38.0","lazy":false},"sap.ushell":{"minVersion":"1.38.0","lazy":false},"sap.i2d.mpe.lib.commons1":{"minVersion":"11.5.0-SNAPSHOT","lazy":false},"sap.i2d.mpe.lib.aors1":{"minVersion":"11.10.0-SNAPSHOT","lazy":true},"sap.i2d.mpe.lib.popovers1":{"minVersion":"11.5.0-SNAPSHOT","lazy":true},"sap.ui.comp":{"minVersion":"1.38.0","lazy":false},"sap.uxap":{"minVersion":"1.38.0","lazy":false},"sap.ui.layout":{"minVersion":"1.38.0","lazy":false},"sap.f":{"minVersion":"1.42.0","lazy":false},"sap.i2d.mpe.lib.qmcomps1":{"minVersion":"11.10.0-SNAPSHOT","lazy":true},"sap.i2d.mpe.lib.workuicomps1":{"minVersion":"5.100.2-SNAPSHOT","lazy":true},"sap.suite.ui.microchart":{"minVersion":"1.44.0","lazy":false},"sap.i2d.mpe.lib.workinstructions1":{"minVersion":"11.8.0-SNAPSHOT","lazy":true}},"components":{}},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"i2d.mpe.operations.manages1.i18n.i18n"},"preload":false},"":{"preload":true,"dataSource":"mainService","settings":{"metadataUrlParams":{"sap-documentation":"heading","sap-value-list":"none"},"defaultCountMode":"Inline"}},"AOR":{"preload":true,"dataSource":"AOR","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"HoldModel":{"preload":true,"dataSource":"MPE_HOLD_SRV","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"Material":{"preload":true,"dataSource":"MaterialPopOver","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"PRDORDOP":{"preload":true,"dataSource":"MPE_PRODOPER_POVER","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"PRODORD":{"preload":true,"dataSource":"MPE_PRODNORD_POVER","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"WORKCENTER":{"preload":true,"dataSource":"MPE_WORKCENTER_POVER","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"CHANGEALERTS":{"preload":true,"dataSource":"MPE_OA_EXECUTION_SRV","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"RESULTRECORDING":{"preload":true,"dataSource":"MPE_EXEC_RR_SRV","settings":{"metadataUrlParams":{"sap-documentation":"heading"}}},"Defects":{"dataSource":"QM_DEFECT_RECORD_SRV","preload":true},"CR":{"uri":"/sap/opu/odata/sap/MPE_CHANGE_RECORD_EXEC_SRV/","type":"sap.ui.model.odata.v2.ODataModel","settings":{"defaultOperationMode":"Server","defaultBindingMode":"OneWay","defaultCountMode":"Request"},"dataSource":"MPE_CHANGE_RECORD_EXEC_SRV","preload":true},"OSR":{"uri":"/sap/opu/odata/sap/MPE_ORDER_SPECIFIC_ROUTING_SRV/","type":"sap.ui.model.odata.v2.ODataModel","settings":{"defaultOperationMode":"Server","defaultBindingMode":"OneWay","defaultCountMode":"Request"},"dataSource":"MPE_ORDER_SPECIFIC_ROUTING_SRV","preload":true},"Documents":{"type":"sap.ui.model.odata.v2.ODataModel","settings":{"defaultOperationMode":"Server","defaultBindingMode":"OneWay","defaultCountMode":"Request"},"dataSource":"MPE_DOCUMENT_LIST_SRV","preload":true}},"config":{"fullWidth":true,"sapFiori2Adaptation":true},"routing":{"config":{"routerClass":"sap.m.routing.Router","viewType":"XML","viewPath":"i2d.mpe.operations.manages1.view","controlId":"app","controlAggregation":"pages","bypassed":{"target":"notFound"},"async":true},"routes":[{"pattern":"ManageOperations/sap-iapp-state={iAppState}","name":"worklist","target":"worklist"},{"pattern":"ManageOperations/{operationId}/sap-iapp-state={iAppState}","name":"object","target":"object"},{"pattern":"OpActyNtwkInstance/{OpActyNtwkInstance}/OpActyNtwkElement/{OpActyNtwkElement}","name":"activityObject","target":"activityObject"},{"pattern":":all*:","name":"catchAll1","target":""}],"targets":{"worklist":{"viewName":"Worklist","viewId":"worklist","viewLevel":1},"object":{"viewName":"Object","viewId":"object","viewLevel":2},"activityObject":{"viewName":"ActivityObject","viewId":"activityObject","viewLevel":3},"objectNotFound":{"viewName":"ObjectNotFound","viewId":"objectNotFound"},"notFound":{"viewName":"NotFound","viewId":"notFound"}}}}}'
},"i2d/mpe/operations/manages1/Component-h2-preload"
);
sap.ui.loader.config({depCacheUI5:{
"i2d/mpe/operations/manages1/Component.js":["i2d/mpe/operations/manages1/controller/ErrorHandler.js","i2d/mpe/operations/manages1/model/models.js","sap/ui/Device.js","sap/ui/core/UIComponent.js","sap/ui/core/routing/HashChanger.js"],
"i2d/mpe/operations/manages1/blocks/ActivitiesBlock.js":["sap/uxap/BlockBase.js"],
"i2d/mpe/operations/manages1/blocks/ActivitiesBlock.view.xml":["i2d/mpe/operations/manages1/blocks/ActivitiesBlockController.controller.js","sap/m/Button.js","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/ObjectIdentifier.js","sap/m/OverflowToolbar.js","sap/m/ProgressIndicator.js","sap/m/Table.js","sap/m/Text.js","sap/m/ToolbarSpacer.js","sap/ui/comp/smarttable/SmartTable.js","sap/ui/core/CustomData.js","sap/ui/core/Icon.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/blocks/ActivitiesBlockController.controller.js":["i2d/mpe/operations/manages1/controller/BaseController.js","i2d/mpe/operations/manages1/model/formatter.js","sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog.js","sap/i2d/mpe/lib/commons1/utils/constants.js","sap/i2d/mpe/lib/commons1/utils/util.js","sap/i2d/mpe/lib/qmcomps1/util/Defects.js","sap/i2d/mpe/lib/workuicomps1/fragments/ChangeAlertComparisonDialog.js","sap/ui/model/Filter.js","sap/ui/model/FilterOperator.js","sap/ui/model/json/JSONModel.js","sap/ui/model/odata/type/Time.js"],
"i2d/mpe/operations/manages1/blocks/ConfirmationBlock.js":["sap/uxap/BlockBase.js"],
"i2d/mpe/operations/manages1/blocks/ConfirmationBlock.view.xml":["i2d/mpe/operations/manages1/blocks/ConfirmationBlockController.controller.js","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/Label.js","sap/m/ObjectIdentifier.js","sap/m/Table.js","sap/m/Text.js","sap/m/VBox.js","sap/ui/comp/smarttable/SmartTable.js","sap/ui/core/CustomData.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/blocks/ConfirmationBlockController.controller.js":["i2d/mpe/operations/manages1/model/formatter.js","sap/ui/core/mvc/Controller.js","sap/ui/model/resource/ResourceModel.js"],
"i2d/mpe/operations/manages1/blocks/InspectionBlock.js":["sap/uxap/BlockBase.js"],
"i2d/mpe/operations/manages1/blocks/InspectionBlock.view.xml":["i2d/mpe/operations/manages1/blocks/InspectionBlockController.controller.js","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/ObjectIdentifier.js","sap/m/ProgressIndicator.js","sap/m/Table.js","sap/m/Text.js","sap/m/VBox.js","sap/ui/comp/smarttable/SmartTable.js","sap/ui/core/CustomData.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/blocks/InspectionBlockController.controller.js":["i2d/mpe/operations/manages1/model/formatter.js","sap/ui/core/mvc/Controller.js","sap/ui/model/Sorter.js","sap/ui/model/odata/type/Time.js","sap/ui/model/resource/ResourceModel.js"],
"i2d/mpe/operations/manages1/blocks/IssuesBlock.js":["sap/uxap/BlockBase.js"],
"i2d/mpe/operations/manages1/blocks/IssuesBlock.view.xml":["i2d/mpe/operations/manages1/blocks/IssuesBlockController.controller.js","sap/i2d/mpe/lib/commons1/fragments/HoldMessageStrip.fragment.xml","sap/m/MessageStrip.js","sap/m/Text.js","sap/m/VBox.js","sap/ui/core/Fragment.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/blocks/IssuesBlockController.controller.js":["i2d/mpe/operations/manages1/model/formatter.js","sap/i2d/mpe/lib/commons1/fragments/HoldMessageStrip.js","sap/i2d/mpe/lib/commons1/fragments/ReleaseHoldDialog.js","sap/i2d/mpe/lib/commons1/utils/formatter.js","sap/ui/core/mvc/Controller.js","sap/ui/model/Filter.js","sap/ui/model/json/JSONModel.js","sap/ui/model/resource/ResourceModel.js"],
"i2d/mpe/operations/manages1/blocks/OperationDetailsHeader.fragment.xml":["sap/m/HBox.js","sap/m/Label.js","sap/m/Link.js","sap/m/ObjectNumber.js","sap/m/Text.js","sap/m/VBox.js","sap/ui/core/Fragment.js"],
"i2d/mpe/operations/manages1/blocks/OperationInProgressBlock.js":["sap/uxap/BlockBase.js"],
"i2d/mpe/operations/manages1/blocks/OperationInProgressBlock.view.xml":["i2d/mpe/operations/manages1/blocks/OperationInProgressController.controller.js","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/Link.js","sap/m/OverflowToolbar.js","sap/m/SearchField.js","sap/m/SegmentedButton.js","sap/m/SegmentedButtonItem.js","sap/m/Table.js","sap/m/Text.js","sap/m/ToolbarSpacer.js","sap/m/VBox.js","sap/suite/ui/microchart/StackedBarMicroChart.js","sap/suite/ui/microchart/StackedBarMicroChartBar.js","sap/ui/comp/smarttable/SmartTable.js","sap/ui/core/CustomData.js","sap/ui/core/Icon.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/blocks/OperationInProgressController.controller.js":["sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus.js","sap/i2d/mpe/lib/commons1/utils/NavHelper.js","sap/i2d/mpe/lib/commons1/utils/formatter.js","sap/i2d/mpe/lib/commons1/utils/util.js","sap/i2d/mpe/lib/popovers1/fragments/MaterialController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderOperationsController.js","sap/ui/core/format/NumberFormat.js","sap/ui/core/mvc/Controller.js","sap/ui/model/Filter.js","sap/ui/model/FilterOperator.js","sap/ui/model/json/JSONModel.js","sap/ui/model/resource/ResourceModel.js"],
"i2d/mpe/operations/manages1/blocks/OperationNotStartedBlock.js":["sap/uxap/BlockBase.js"],
"i2d/mpe/operations/manages1/blocks/OperationNotStartedBlock.view.xml":["i2d/mpe/operations/manages1/blocks/OperationNotStartedController.controller.js","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/Link.js","sap/m/OverflowToolbar.js","sap/m/SearchField.js","sap/m/SegmentedButton.js","sap/m/SegmentedButtonItem.js","sap/m/Table.js","sap/m/Text.js","sap/m/ToolbarSpacer.js","sap/m/VBox.js","sap/suite/ui/microchart/StackedBarMicroChart.js","sap/suite/ui/microchart/StackedBarMicroChartBar.js","sap/ui/comp/smarttable/SmartTable.js","sap/ui/core/CustomData.js","sap/ui/core/Icon.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/blocks/OperationNotStartedController.controller.js":["sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus.js","sap/i2d/mpe/lib/commons1/utils/NavHelper.js","sap/i2d/mpe/lib/commons1/utils/formatter.js","sap/i2d/mpe/lib/commons1/utils/util.js","sap/i2d/mpe/lib/popovers1/fragments/MaterialController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderOperationsController.js","sap/m/MessageBox.js","sap/ui/core/format/NumberFormat.js","sap/ui/core/mvc/Controller.js","sap/ui/model/Filter.js","sap/ui/model/FilterOperator.js","sap/ui/model/json/JSONModel.js","sap/ui/model/resource/ResourceModel.js"],
"i2d/mpe/operations/manages1/controller/ActivityObject.controller.js":["i2d/mpe/operations/manages1/controller/BaseController.js","i2d/mpe/operations/manages1/model/formatter.js","i2d/mpe/operations/manages1/utility/InlineWorkInstructions.js","sap/ui/model/json/JSONModel.js"],
"i2d/mpe/operations/manages1/controller/App.controller.js":["i2d/mpe/operations/manages1/controller/BaseController.js","sap/ui/model/json/JSONModel.js"],
"i2d/mpe/operations/manages1/controller/BaseController.js":["sap/ui/core/mvc/Controller.js"],
"i2d/mpe/operations/manages1/controller/ErrorHandler.js":["sap/m/MessageBox.js","sap/ui/base/Object.js"],
"i2d/mpe/operations/manages1/controller/NotFound.controller.js":["i2d/mpe/operations/manages1/controller/BaseController.js"],
"i2d/mpe/operations/manages1/controller/Object.controller.js":["i2d/mpe/operations/manages1/controller/BaseController.js","i2d/mpe/operations/manages1/model/formatter.js","sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog.js","sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus.js","sap/i2d/mpe/lib/commons1/fragments/ReleaseHoldDialog.js","sap/i2d/mpe/lib/commons1/utils/constants.js","sap/i2d/mpe/lib/commons1/utils/formatter.js","sap/i2d/mpe/lib/commons1/utils/util.js","sap/i2d/mpe/lib/popovers1/fragments/MaterialController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController.js","sap/i2d/mpe/lib/popovers1/fragments/WorkCenterController.js","sap/i2d/mpe/lib/qmcomps1/util/Defects.js","sap/i2d/mpe/lib/qmcomps1/util/Formatter.js","sap/m/MessageBox.js","sap/m/MessageToast.js","sap/ui/core/routing/History.js","sap/ui/model/json/JSONModel.js"],
"i2d/mpe/operations/manages1/controller/Worklist.controller.js":["i2d/mpe/operations/manages1/controller/BaseController.js","i2d/mpe/operations/manages1/model/formatter.js","sap/i2d/mpe/lib/aors1/AOR/AORFragmentHandler.js","sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog.js","sap/i2d/mpe/lib/commons1/fragments/OrdSpcfcChange.js","sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus.js","sap/i2d/mpe/lib/commons1/utils/NavHelper.js","sap/i2d/mpe/lib/commons1/utils/constants.js","sap/i2d/mpe/lib/commons1/utils/saveAsTile.js","sap/i2d/mpe/lib/commons1/utils/util.js","sap/i2d/mpe/lib/popovers1/fragments/IssuePopOverController.js","sap/i2d/mpe/lib/popovers1/fragments/MaterialController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController.js","sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderOperationsController.js","sap/i2d/mpe/lib/popovers1/fragments/WorkCenterController.js","sap/m/MessageBox.js","sap/m/MessageToast.js","sap/ui/model/Filter.js","sap/ui/model/json/JSONModel.js"],
"i2d/mpe/operations/manages1/model/formatter.js":["sap/ui/core/format/DateFormat.js","sap/ui/core/format/NumberFormat.js","sap/ui/model/odata/type/Time.js"],
"i2d/mpe/operations/manages1/model/models.js":["sap/ui/Device.js","sap/ui/model/json/JSONModel.js"],
"i2d/mpe/operations/manages1/utility/InlineWorkInstructions.js":["sap/m/MessageToast.js","sap/ui/base/Object.js"],
"i2d/mpe/operations/manages1/view/ActivityObject.view.xml":["i2d/mpe/operations/manages1/controller/ActivityObject.controller.js","sap/i2d/mpe/lib/commons1/blocks/PRTBlock.js","sap/i2d/mpe/lib/qmcomps1/view/AggregatedResults.view.xml","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/ObjectAttribute.js","sap/m/ObjectIdentifier.js","sap/m/ObjectNumber.js","sap/m/ObjectStatus.js","sap/m/Table.js","sap/m/Text.js","sap/m/UploadCollection.js","sap/m/UploadCollectionItem.js","sap/m/semantic/FullscreenPage.js","sap/ui/core/ComponentContainer.js","sap/ui/core/ExtensionPoint.js","sap/ui/core/mvc/XMLView.js","sap/ui/layout/VerticalLayout.js","sap/uxap/ObjectPageHeader.js","sap/uxap/ObjectPageLayout.js","sap/uxap/ObjectPageSection.js","sap/uxap/ObjectPageSubSection.js"],
"i2d/mpe/operations/manages1/view/App.view.xml":["i2d/mpe/operations/manages1/controller/App.controller.js","sap/m/App.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/view/NotFound.view.xml":["i2d/mpe/operations/manages1/controller/NotFound.controller.js","sap/m/Link.js","sap/m/MessagePage.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/view/Object.view.xml":["i2d/mpe/operations/manages1/blocks/ActivitiesBlock.js","i2d/mpe/operations/manages1/blocks/ConfirmationBlock.js","i2d/mpe/operations/manages1/blocks/InspectionBlock.js","i2d/mpe/operations/manages1/blocks/IssuesBlock.js","i2d/mpe/operations/manages1/blocks/OperationDetailsHeader.fragment.xml","i2d/mpe/operations/manages1/blocks/OperationInProgressBlock.js","i2d/mpe/operations/manages1/blocks/OperationNotStartedBlock.js","i2d/mpe/operations/manages1/controller/Object.controller.js","sap/i2d/mpe/lib/commons1/blocks/ComponentsBlock.js","sap/i2d/mpe/lib/commons1/blocks/OrderScheduleBlock.js","sap/i2d/mpe/lib/qmcomps1/view/DefectsFragment/DefectMessageStrip.fragment.xml","sap/i2d/mpe/lib/qmcomps1/view/DefectsFragment/defectRecordingList.fragment.xml","sap/m/Button.js","sap/m/Label.js","sap/m/Text.js","sap/m/VBox.js","sap/m/semantic/FullscreenPage.js","sap/ui/core/Fragment.js","sap/ui/core/mvc/XMLView.js","sap/uxap/ObjectPageHeader.js","sap/uxap/ObjectPageLayout.js","sap/uxap/ObjectPageSection.js","sap/uxap/ObjectPageSubSection.js"],
"i2d/mpe/operations/manages1/view/ObjectNotFound.view.xml":["i2d/mpe/operations/manages1/controller/NotFound.controller.js","sap/m/Link.js","sap/m/MessagePage.js","sap/ui/core/mvc/XMLView.js"],
"i2d/mpe/operations/manages1/view/Worklist.view.xml":["i2d/mpe/operations/manages1/controller/Worklist.controller.js","sap/f/DynamicPage.js","sap/f/DynamicPageHeader.js","sap/f/DynamicPageTitle.js","sap/m/Button.js","sap/m/Column.js","sap/m/ColumnListItem.js","sap/m/HBox.js","sap/m/Label.js","sap/m/Link.js","sap/m/MultiComboBox.js","sap/m/OverflowToolbar.js","sap/m/ProgressIndicator.js","sap/m/Select.js","sap/m/Table.js","sap/m/Text.js","sap/m/ToolbarSpacer.js","sap/m/VBox.js","sap/m/semantic/FullscreenPage.js","sap/ui/comp/smartfilterbar/ControlConfiguration.js","sap/ui/comp/smartfilterbar/SmartFilterBar.js","sap/ui/comp/smarttable/SmartTable.js","sap/ui/comp/smartvariants/SmartVariantManagement.js","sap/ui/core/CustomData.js","sap/ui/core/Icon.js","sap/ui/core/Item.js","sap/ui/core/mvc/XMLView.js"]
}});
