/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"i2d/mpe/operations/manages1/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"i2d/mpe/operations/manages1/model/formatter",
	"i2d/mpe/operations/manages1/utility/InlineWorkInstructions"
], function (BaseController, JSONModel, formatter, InlineWorkInstructions) {
	"use strict";

	return BaseController.extend("i2d.mpe.operations.manages1.controller.ActivityObject", {
		formatter: formatter,

		/**
		 * Called when the Activity Object controller is instantiated.
		 * @public
		 */
		onInit: function () {
			//JSON Model
			var oViewModel = new JSONModel({
				busyIndicatorDelay: 0,
				WIVisible: false,
				documentsCount: 0,
				recordResults: false,
				busy: false,
				documents: []
			});
			//Inline Work Instructions Class
			this.InlineWorkInstructions = new InlineWorkInstructions(this);
			// set view model
			this.setModel(oViewModel, "activityObjectView");

			this.getRouter().getRoute("activityObject").attachPatternMatched(this._handleRouteMatched, this);

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'activityObject'
		 * @private
		 */
		_handleRouteMatched: function (oEvent) {
			var sOpActyNtwkInstance = oEvent.getParameter("arguments").OpActyNtwkInstance;
			var sOpActyNtwkElement = oEvent.getParameter("arguments").OpActyNtwkElement;
			this.iAppState = oEvent.getParameter("arguments").iAppState;

			var that = this;
			this.getModel().metadataLoaded().then(function () {
				that._bindView(sOpActyNtwkInstance, sOpActyNtwkElement);
			});
			// this._bindView(sOpActyNtwkInstance, sOpActyNtwkElement);

			//var sAppState = oEvent.getParameter("arguments").iAppState;
			//var sConfigName = oEvent.getParameter("config").name;
			//this.getOwnerComponent().extractInnerAppStateFromURL(sAppState, sConfigName, sOpActyNtwkInstance, sOpActyNtwkElement);

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sOpActyNtwkInstance, sOpActyNtwkElement) {
			var oViewModel = this.getModel("activityObjectView"),
				oDataModel = this.getModel();

			var sKey = oDataModel.createKey("C_ProcgExecOperationActivity", {
				OpActyNtwkInstance: sOpActyNtwkInstance,
				OpActyNtwkElement: sOpActyNtwkElement
			});
			
			//Reset data when binding changes
			oViewModel.setProperty("/documents", []);
			oViewModel.setProperty("/documentsCount", 0);

			var sKeyPath = "/" + sKey;
			this.getView().bindElement({
				path: sKeyPath,
				parameters: {
					expand: "to_MfgOrderDocInfoRecdObjLink,to_OperationActyPRTAssignment,to_OperationActivityComponent,to_ShopFloorItemAtOpActy"
				},
				events: {
					change: this._onBindingChange.bind(this, sOpActyNtwkInstance, sOpActyNtwkElement),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function (oData) {
						//PRT block has 2 smart tables and their visibility relies on values available in 2 different models
						// i.e. default model (undefined) or a named model ("OA"). In this app, 'OA' model doesn't exist, therefore 2 smart
						//tables are displayed. Creating this dummy model to correct the visibility
						this.getView().setModel(new sap.ui.model.json.JSONModel({
							to_OperationActyPRTAssignment: null
						}), "OA");

						var oOAInfo = oData.getParameter("data");
						//this.addSerialNumbers(oOAInfo.to_ShopFloorItemAtOpActy);
						/*populate Inline Work instructions*/
						this.instantiateInlineWIReuseComponent(oOAInfo.MfgWorkInstructionContent, oOAInfo.MfgWorkInstructionMode);

						var i = oOAInfo.to_OperationActyPRTAssignment.length;
						while (i--) {
							// for (var i = 0; i < oOAInfo.to_OperationActyPRTAssignment.length; i++) {
							if (oOAInfo.to_OperationActyPRTAssignment[i].ProdnRsceToolCategory === "D") {
								var that = this;
								var aDocumentProperties = oOAInfo.to_OperationActyPRTAssignment[i].ProductionResourceTool.split(" ");
								this.getModel("Documents").callFunction("/GetAllOriginals", {
									urlParameters: {
										Documentnumber: aDocumentProperties[0],
										Documenttype: aDocumentProperties[1],
										Documentpart: aDocumentProperties[2],
										Documentversion: aDocumentProperties[3]
									},
									success: function (oFiles) {
										oFiles.results.forEach(function (oDocument) {
											//Create own URL as one from oFiles has alias of backend server
											oDocument.URL = formatter.getURLForDocument(oDocument);
											oDocument.Source = that.getResourceBundle().getText("PRT");
										});

										//There can be multiple calls for multiple documents. Append data of various files from all such documents
										var aFiles = that.getModel("activityObjectView").getProperty("/documents");
										that.getModel("activityObjectView").setProperty("/documents", aFiles.concat(oFiles.results));
										that.getModel("activityObjectView").setProperty("/documentsCount",
											that.getModel("activityObjectView").getProperty("/documentsCount") + oFiles.results.length);
									}
								});
								oOAInfo.to_OperationActyPRTAssignment.splice(i, 1);
							}
						}

						/*  result recording starting point  */
						/* Commented out because i2d.mpe.lib.qmcomps1 is not yet delivered in cloud */
						this.callResultRecording(oOAInfo.OpActyNtwkInstance, oOAInfo.OpActyNtwkElement);
						oViewModel.setProperty("/busy", false);
					}.bind(this)
				}
			});
		},

		/* Inline Work instructions
		 *populate Inline Work Instruction With Recorded results in Case of Advanced Mode of the editor
		 */
		instantiateInlineWIReuseComponent: function (sHtmlContent, mode) {

			if (sHtmlContent !== "" && sHtmlContent !== undefined) {
				this.InlineWorkInstructions.instantiateReuseComponent(sHtmlContent);
				this.getModel("activityObjectView").setProperty("/WIVisible", true);
				if (mode === "ADVANCED") {
					this.InlineWorkInstructions._initializeInlineEditingModel();
				}
			} else {
				//Make the facet invisible 
				this.getModel("activityObjectView").setProperty("/WIVisible", false);
			}
		},

		/* Commented out because i2d.mpe.lib.qmcomps1 is not yet delivered in cloud */
		callResultRecording: function (OpActyNtwkInstance, OpActyNtwkElement) {
			var ViewId, oController;
			ViewId = this.byId("idInspCharView");
			oController = ViewId.getController();
			var oTable = ViewId.byId("idInspCharcsTable");
			oController.setProperties(OpActyNtwkInstance, OpActyNtwkElement, "", "", oTable);
			oController.refresh();
		},

		/*
		 *To call binding of the blocks, 
		 *in case the view is bound with a model *
		 */
		_onBindingChange: function (sOpActyNtwkInstance, sOpActyNtwkElement) {
			/*  result recording starting point  */
			/* Commented out because i2d.mpe.lib.qmcomps1 is not yet delivered in cloud */
			// this.callResultRecording(sOpActyNtwkInstance, sOpActyNtwkElement);
		}
	});
});