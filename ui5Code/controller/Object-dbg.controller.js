/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global location*/
sap.ui.define([
	"i2d/mpe/operations/manages2/controller/BaseController",
	//	"i2d/mpe/operations/manages2/blocks/IssuesBlockController.controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"i2d/mpe/operations/manages2/model/formatter",
	"sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
	"sap/i2d/mpe/lib/popovers1/fragments/WorkCenterController",
	"sap/i2d/mpe/lib/commons1/utils/util",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus",
	"sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog",
	"sap/i2d/mpe/lib/commons1/fragments/ReleaseHoldDialog",
	"sap/i2d/mpe/lib/commons1/utils/constants",
	"sap/i2d/mpe/lib/commons1/utils/formatter",
	"sap/i2d/mpe/lib/qmcomps1/util/Defects",
	"sap/i2d/mpe/lib/qmcomps1/util/Formatter",
	"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController"
], function (BaseController, JSONModel, History, formatter, MaterialPopOver, WorkCenterPopOver, reuseUtil, MessageToast, MessageBox,
	OrderOperationStatus,
	ApplyHoldDialog, ReleaseHoldDialog, ReuseProjectConstants, commonformatter, Defects, defectFormatter, ProductionOrderPopOver) {
	"use strict";

	return BaseController.extend("i2d.mpe.operations.manages2.controller.Object", {

		formatter: formatter,
		reuseUtil: reuseUtil,
		commonformatter: commonformatter,
		defectFormatter: defectFormatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay;
			var oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("AppState", "hanldeAppstateDetailChanges", this.hanldeAppstateDetailChanges, this);
			this._oOneOperationReleaseButton = this.getView().byId("idOneOperationReleaseButton");
			this.getRouter().getRoute("object").attachPatternMatched(this._handleRouteMatched, this);
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this._oHoldButton = this.getView().byId("idOperationHoldButton");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			// Initializing popover instances
			this.oMaterialPop = new MaterialPopOver();
			this.oWorkCenterPop = new WorkCenterPopOver();
			this.oProductionOrderPop = new ProductionOrderPopOver();
			var oObjectPageLayout = this.getView().byId("idOpreationObjectPageLayout");
			formatter.setOperationDetailPageReferences(oObjectPageLayout, this);
			commonformatter.setObjectPageLayoutReference(oObjectPageLayout);
			reuseUtil.setObjectPageRefrence(this);

			// Set parameters for event bus
			var oEventBusParams = this.getEventBusParameters();
			ApplyHoldDialog.setEventBusParameters(oEventBus, oEventBusParams.ApplyHoldDialog.Channel,
				oEventBusParams.ApplyHoldDialog.Event);

			//Event Bus for Release Hold
			var oReleaseEventBusParams = this.getReleaseEventBusParameters();
			var oEventBus = sap.ui.getCore().getEventBus();
			var oOperationDetailModel = this.getOwnerComponent().getModel("DetailModel");
			var oOperationDetailData = oOperationDetailModel.getData();
			if (oOperationDetailData.bEnableAutoBinding) {
				this._bDetailsScreenInitialLoad = true;
			} else {
				this._bDetailsScreenInitialLoad = false;
			}
			// TODO: use instead own function, not from IssueBlock
			//IssuesBlockController.setEventBusParameters(oEventBus, oReleaseEventBusParams.ReleaseHoldDialog.Channel, oReleaseEventBusParams.ReleaseHoldDialog.Event);

			var oActionButtonVisibilityModel = this.getOwnerComponent().getModel("ActionButtonVisiblity");
			if (!oActionButtonVisibilityModel) {
				//Visibility of Edit and Confirm Button
				if (sap.ushell && sap.ushell.Container) {
					var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
					var aSemantic = [];
					var oSemanticProductionOrderChange = "#ProductionOrder-change"; //Intent-action
					aSemantic.push(oSemanticProductionOrderChange);
					var oSemanticProductionOrderConfirmation = "#ProductionOrderConfirmation-createTimeTicket"; //Intent-action
					aSemantic.push(oSemanticProductionOrderConfirmation);
					oService.isIntentSupported(aSemantic).done(function (oCheck) {
						if (oCheck) {
							var visibility = {
								editOrder: false,
								confirmOrder: false
							};
							visibility.editOrder = oCheck["#ProductionOrder-change"].supported;
							visibility.confirmOrder = oCheck["#ProductionOrderConfirmation-createTimeTicket"].supported;

							var oButtonData = {
								EditButtonVisible: visibility.editOrder,
								ConfirmButtonVisible: visibility.confirmOrder
							};
							this.getOwnerComponent().setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
						}
					}.bind(this)).
					fail(function () {
						var oButtonData = {
							EditButtonVisible: true,
							ConfirmButtonVisible: true
						};
						this.getOwnerComponent().setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
						jQuery.sap.log.error("Reading intent data failed.");
					}.bind(this));
				} else {
					var oButtonData = {
						EditButtonVisible: true,
						ConfirmButtonVisible: true
					};
					this.getOwnerComponent().setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
				}
			}
			this._DefectsClass = new Defects();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/*
		 * formatter to get the Order number along with Order text ,
		 * as the title in the object page header
		 * @param {string} sManufacturingOrder - the Order number 
		 */
		getManufaturingOrderTextInDetailsPage: function (sManufacturingOrder) {
			return this.getResourceBundle().getText("OrderNumber", [sManufacturingOrder]);
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_handleRouteMatched: function (oEvent) {
			var operationId = oEvent.getParameter("arguments").operationId;
			this.iAppState = oEvent.getParameter("arguments").iAppState;

			this.sOperationId = operationId;
			this.sOrderInternalBillOfOperations = this.extractNumberFromString(operationId.split(",")[0]);
			this.sOrderIntBillOfOperationsItem = this.extractNumberFromString(operationId.split(",")[1]);

			this.updateOperationDetailModel();

			this.getModel().metadataLoaded().then(function () {
				this._bindView("/" + operationId);
			}.bind(this));

			var sAppState = oEvent.getParameter("arguments").iAppState;
			var sConfigName = oEvent.getParameter("config").name;
			this.getOwnerComponent().extractInnerAppStateFromURL(sAppState, sConfigName, operationId);
		},

		/*
		 *To hide HOLD button and HOLD functionlaity
		 * @param {string} MfgFeatureIsActiveInAnyPlant
		 * @return TRUE if MfgFeatureIsActiveInAnyPlant = "X", else FALSE
		 */
		onDataReceived: function (oEvent) {

			var aComponents = oEvent.getParameters().getParameters().data.results;
			var sHoldVisible = aComponents[0].MfgFeatureIsActiveInAnyPlant;

			if (sHoldVisible === "X") {
				this._oHoldButton.setVisible(true);

			} else {
				this._oHoldButton.setVisible(false);

			}
			this.setCustomFiltersData(sHoldVisible);

		},

		/*
		 * To ectract number from string
		 * @param {string} sString which contains the number
		 * @returns number from the string
		 */

		extractNumberFromString: function (sString) {
			var regex = /\d+/g;
			return sString.match(regex)[0];
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var that = this;
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();
			var oDetailModel = this.getModel("DetailModel"),
				oOperationDetailData = oDetailModel.getData();
			oDataModel.setUseBatch(false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: $.proxy(function () {
						oViewModel.setProperty("/busy", false);
						var oBindingContext = this.getView().getBindingContext();
						var oModel = this.getView().getModel();
						var MfgFeatureIsActiveInAnyPlant = oModel.getProperty("MfgFeatureIsActiveInAnyPlant", oBindingContext);
						if (oOperationDetailData.selectedOrderData && MfgFeatureIsActiveInAnyPlant === undefined) {
							MfgFeatureIsActiveInAnyPlant = oOperationDetailData.selectedOrderData.MfgFeatureIsActiveInAnyPlant;
						}
						var bPEOFeatureAvailable = formatter.setHoldIconVisibility(MfgFeatureIsActiveInAnyPlant);
						//Notifying blocks, that data has been binded to object page, so load the data in table
						if (bPEOFeatureAvailable) {
							this._DefectsClass.setProperties(this, oBindingContext);
							var oData = that.getModel().getObject(that.getView().getBindingContext().getPath());
							that._DefectsClass.setFilters(oData.ManufacturingOrder, oData.OrderIntBillOfOperationsItem);
							that._DefectsClass.checkExistingDefects();
						}
					}, this)
				}
			});
		},

		defectsCallbackFn: function (aDefects) {
			if (aDefects.length > 0 && aDefects[0].to_ShopFloorItem) {
				this._DefectsClass.setVisibleColumns(true, false);
			}
		},

		onNavToDefect: function (oEvent) {
			this._DefectsClass.onNavToDefect(oEvent);
		},

		/*
		 *To call binding of the tables, 
		 *in case the view is bound with a model *
		 */
		_onBindingChange: function () {
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");
			var oElementBinding = oView.getElementBinding();
			oViewModel.setProperty("/busy", false);
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			if (this._bDetailsScreenInitialLoad === false) {
				this.rebindAllTablesOfAllBlocks();
			} else {
				this._bDetailsScreenInitialLoad = false;
			}
			this.bSecondReqToThisPage = true;
			// jQuery.sap.delayedCall(3000, this, function () {
			// 	if(this.getModel && this.getView()){
			// 		this.getModel().setUseBatch(true);
			// 	}
			// });
		},

		/** 
		 * This function rebinds all the tables of all the blocks,
		 * Its kind of notifying the controllers of different blocks
		 * because the controllers of blocks are not been communicated anyway, just binding element in object page.
		 */
		rebindAllTablesOfAllBlocks: function () {
			var oBindingContext = this.getView().getBindingContext();
			var oModel = this.getView().getModel();
			var MfgFeatureIsActiveInAnyPlant = oModel.getProperty("MfgFeatureIsActiveInAnyPlant", oBindingContext);
			var bPEOFeatureAvailable = formatter.setHoldIconVisibility(MfgFeatureIsActiveInAnyPlant);
			//Notifying blocks, that data has been binded to object page, so load the data in table
			this.rebindTableOfBlock("idComponentsBlock", "idAllComponentsTable");
			if (bPEOFeatureAvailable) {
				this.rebindTableOfBlock("idActivitiesBlock", "idActivitiesSmartTable");
			}
			this.rebindTableOfBlock("idOperationsScheduleBlock", "idAllOrderScheduleTable");
			this.rebindTableOfBlock("idOperationPrgress", "idOperationInProgressTable");
			this.rebindTableOfBlock("idOperationNotStarted", "idOperationNotStartedTable");
			this.rebindTableOfBlock("idOrderConfirmationBlock", "idAllConfirmationTable");
			this.rebindTableOfBlock("idInspectionBlock", "idInspectionBlockSmartTable");
		},
		/* Update the model with the latest order id,
		 * On subscribing, using Event bus
		 * @param oEvent - sChannelId
		 * @param oAppstate - sEventId
		 * @param oData - gives the detailPage model data.
		 */
		hanldeAppstateDetailChanges: function (oEvent, oAppstate, oData) {
			var oModel = this.getView().getModel("DetailModel");
			if (oModel) {
				var oOperationDetailData = oModel.getData();
				oOperationDetailData.orderId = oData.orderId;
				oOperationDetailData.sOrderInternalBillOfOperations = oData.sOrderInternalBillOfOperations;
				oOperationDetailData.sOrderIntBillOfOperationsItem = oData.sOrderIntBillOfOperationsItem;
				if (oData.selectedOrderData) {
					oOperationDetailData.selectedOrderData = oData.selectedOrderData;
				}
				oModel.setData(oOperationDetailData);
			}

		},
		/** 
		 * Updates the operation detail model with the latest operation binded to the view.
		 */
		updateOperationDetailModel: function () {
			var oModel = this.getView().getModel("DetailModel");
			var oOperationDetailData = oModel.getData();
			oOperationDetailData.orderId = this.sOperationId;
			oOperationDetailData.sOrderInternalBillOfOperations = this.sOrderInternalBillOfOperations;
			oOperationDetailData.sOrderIntBillOfOperationsItem = this.sOrderIntBillOfOperationsItem;
			oOperationDetailData.sAppId = this.iAppState;
			oModel.setData(oOperationDetailData);
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			var aProperties = ioAppStateModel.getProperty("/appState");
			aProperties.detailPage = oOperationDetailData;
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},

		/** 
		 * Rebinds the a table of a perticular block
		 * @param sBlockId
		 * @param sTableId
		 */
		rebindTableOfBlock: function (sBlockId, sTableId) {
			var oBlock = this.getView().byId(sBlockId);
			if (oBlock) {
				var sViewId = oBlock.getSelectedView();
				if (sViewId) {
					var oBlockView = sap.ui.getCore().byId(sViewId);
					//Reseting segmented button to first button in OrderOperationsBlock
					if (sBlockId === "idOrderOperationsBlock") {
						var oSegmentedBtn = oBlockView.byId("btnSegmntOrderOperation");
						oSegmentedBtn.setSelectedButton(oSegmentedBtn.getButtons()[0]);
					}
					var oSmartTable = oBlockView.byId(sTableId);
					oSmartTable.rebindTable();
				}
			}
		},

		/** 
		 * Handler for material link press, opens a popover which shows the details of the material
		 * @param oEvent
		 */
		handleMaterialLinkPress: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext();
			var oModel = oContext.getModel();
			var sProductionPlant = oModel.getProperty("ProductionPlant", oContext);
			var sMaterial = oModel.getProperty("Material", oContext);
			// var sMRPArea = oModel.getProperty("MRPArea", oContext) || oModel.getProperty("ProductionPlant", oContext);
			this.oMaterialPop.openMaterialPopOver(oEvent, this, sMaterial, sProductionPlant);
		},

		/** 
		 * Handler for WorkCenter link press, opens a popover which shows the details of the WorkCenter
		 * @param oEvent
		 */
		handleWorkCenterPress: function (oEvent) {
			this.oWorkCenterPop.openWorkCenterPopOver(oEvent, this);
		},
		/**
		 *On CLick of Order Number in Details Page of Operation App
		 *Navigate to Details Page of Order App
		 **/
		handleNavOrderDetail: function (oEvent) {
			var oSource = oEvent.getSource();
			if (oSource.getBindingContext() !== undefined) {

				var sPath = oSource.getBindingContext().sPath;
				var oProperty = oSource.getModel().getProperty(sPath);
				var sManufacturingOrderId = oProperty.ManufacturingOrder || oProperty.MRPElement;
				this.oProductionOrderPop.openProdOrdPopOver(oEvent, this, sManufacturingOrderId);

				var sOrder = formatter.getWordInBrackets("'" + oEvent.getSource().getText() + "'");
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#ManufacturingOrderItem-manage&/ManageOrders/C_Manageorders" + sOrder
					}
				});
			}
		},

		/**
		 * Handler for Order operation confirmation.
		 * this methods will open SAP transation in a new tab.
		 **/
		handleConfirmOperation: function () {
			var oCurrentOperation = this.getView().getBindingContext().getObject();
			var sManufacturingOrder = oCurrentOperation.ManufacturingOrder;
			var sManufacturingOrderOperation = oCurrentOperation.ManufacturingOrderOperation;
			var sManufacturingOrderSequence = oCurrentOperation.ManufacturingOrderSequence;
			reuseUtil.confirmOrderOperation(sManufacturingOrder, sManufacturingOrderOperation, sManufacturingOrderSequence);
		},

		/**
		 * Handler for Edit order operation
		 * This method witll open SAP CO02 transaction in a new tab.
		 **/
		handleEditOperation: function () {
			var oCurrentOperation = this.getView().getBindingContext().getObject();
			reuseUtil.editOrder(oCurrentOperation.ManufacturingOrder);
		},

		/**
		 * Handler of Display WorkCenter Button
		 * This will open work center object page
		 */
		handleDisplayWorkCenterPress: function () {
			var oCurrentOperation = this.getView().getBindingContext().getObject();
			var sWorkCenterInternalId = oCurrentOperation.WorkCenterInternalID;
			var sWorkCenterTypeCode = oCurrentOperation.WorkCenterTypeCode;
			var para = {
				WorkCenterInternalID: sWorkCenterInternalId,
				WorkCenterTypeCode: sWorkCenterTypeCode
			};
			if (sWorkCenterInternalId && sWorkCenterTypeCode) {
				var fgetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
				var oCrossAppNavigator = fgetService && fgetService("CrossApplicationNavigation");
				// trigger navigation
				if (oCrossAppNavigator) {
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "WorkCenter",
							action: "displayFactSheet"
						},
						params: para
					});
				}
			}
		},

		/** 
		 * Handler for status link press, opens a popover which shows the order status information
		 * @param oEvent
		 */
		handleStatusLinkPress: function (oEvent) {
			OrderOperationStatus.openStatusPopOver(oEvent, this);
		},

		/*
		 *To unsubscribe the event bus
		 * on exit of application
		 */
		onExit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("AppState", "hanldeAppstateDetailChanges", this.hanldeAppstateDetailChanges, this);
			// this.getModel().setUseBatch(true);
		},

		handleReleaseOperationPress: function () {
			var oCurrentOperation = this.getView().getBindingContext().getObject();
			var sOrderInternalBillOfOperations = oCurrentOperation.OrderInternalBillOfOperations;
			var sOrderIntBillOfOperationsItem = oCurrentOperation.OrderIntBillOfOperationsItem;

			var oSuccessMessage = {
				aError: [],
				aWarning: []
			};
			var oLocalModel = this.getView().getModel();
			this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
			this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
			var mParams = {
				"method": "POST",
				"urlParameters": {
					"OrderInternalBillOfOperations": "",
					"OrderIntBillOfOperationsItem": ""
				},
				"success": function (oData, response) {
					var oModel;
					var oOrderDetailData;
					var oParentModel;
					var sPath;
					var oResponse = JSON.parse(response.headers["sap-message"]);
					if (oResponse.severity === "error" || oResponse.severity === "warning") {
						if (oResponse.severity === "error") {
							oSuccessMessage.aError.push(oResponse);
						} else {
							oSuccessMessage.aWarning.push(oResponse);
						}
					}
					for (var i = 0; i < oResponse.details.length; i++) {
						if (oResponse.details[i].severity === "error" || oResponse.details[i].severity === "warning") {
							if (oResponse.details[i].severity === "error") {
								oSuccessMessage.aError.push(oResponse.details[i]);
							} else {
								oSuccessMessage.aWarning.push(oResponse.details[i]);
							}
						}
					}
					var sMessageText, sFinalText, bCompact, z;
					if (oSuccessMessage.aError.length > 0) {
						if (oSuccessMessage.aError[0].code !== "AG/024") {
							sMessageText = this.getI18NText("oneOperationReleaseRequestErrorMSG", [oData.ManufacturingOrder, oData.ManufacturingOrderOperation]);
							sFinalText = oSuccessMessage.aError[0].message;
							for (z = 1; z < oSuccessMessage.aError.length; z++) {
								sFinalText = sFinalText + "\n" + oSuccessMessage.aError[z].message;
							}
							if (oSuccessMessage.aWarning.length > 0) {
								for (z = 0; z < oSuccessMessage.aWarning.length; z++) {
									sFinalText = sFinalText + "\n" + this.getI18NText("WarningInBrackets", oSuccessMessage.aWarning[z].message);
								}
								sMessageText = this.getI18NText("operationReleaseErrorAndWarningMSG", [oSuccessMessage.aError.length, oSuccessMessage.aWarning
									.length
								]);
							}
							bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
							this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, this.getI18NText("ErrorPopupTitle"), [MessageBox.Action.CLOSE],
								"ErrorOrderMSG", sFinalText, bCompact);
						} else if (oSuccessMessage.aError[0].code === "AG/024") {
							MessageBox.warning(
								oSuccessMessage.aError[0].message, {
									styleClass: bCompact ? "sapUiSizeCompact" : ""
								}
							);
						}
					} else if (oSuccessMessage.aWarning.length > 0) {
						sMessageText = this.getI18NText("oneOperationReleaseWarningMSG", [oData.ManufacturingOrder, oData.ManufacturingOrderOperation]);
						sFinalText = oSuccessMessage.aWarning[0].message;
						for (z = 1; z < oSuccessMessage.aWarning.length; z++) {
							sFinalText = sFinalText + "\n" + oSuccessMessage.aWarning[z].message;
						}
						bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
						this.getDynamicMessageBox(sMessageText, MessageBox.Icon.WARNING, this.getI18NText("WarningPopupTitle"), [MessageBox.Action.CLOSE],
							"WarningOrderMSG", sFinalText, bCompact);
						this._oOneOperationReleaseButton.setEnabled(false);
						this.rebindAllTablesOfAllBlocks();
						oModel = this.oIssuesBlock.getModel("DetailModel");
						oOrderDetailData = oModel.getData();
						oOrderDetailData.bReleasedSuccess = true;
						this.oIssuesBlock.sOrderId = oOrderDetailData.orderId;
						oParentModel = this.oIssuesBlock.oParentBlock.getModel();
						sPath = this.oIssuesBlock.oParentBlock.getModel().oData[this.oIssuesBlock.sOrderId];
						formatter.handleIsuesValue(oParentModel, sPath, this.oIssuesBlock);
						oModel.setData(oOrderDetailData);
					} else {
						sMessageText = this.getI18NText("oneOperationReleasedSuccessMSG", [oData.ManufacturingOrder, oData.ManufacturingOrderOperation]);
						MessageToast.show(sMessageText, {
							duration: 5000
						});
						this._oOneOperationReleaseButton.setEnabled(false);
						this.rebindAllTablesOfAllBlocks();
						oModel = this.oIssuesBlock.getModel("DetailModel");
						oOrderDetailData = oModel.getData();
						oOrderDetailData.bReleasedSuccess = true;
						this.oIssuesBlock.sOrderId = oOrderDetailData.orderId;
						oParentModel = this.oIssuesBlock.oParentBlock.getModel();
						sPath = this.oIssuesBlock.oParentBlock.getModel().oData[this.oIssuesBlock.sOrderId];
						formatter.handleIsuesValue(oParentModel, sPath, this.oIssuesBlock);
						oModel.setData(oOrderDetailData);
					}
				}.bind(this),
				"error": function (oError) {
					MessageToast.show(this.getI18NText("ReleaseFailed"));
					this._oOneOperationReleaseButton.setEnabled(false);
				}
			};

			mParams.urlParameters.OrderInternalBillOfOperations = sOrderInternalBillOfOperations;
			mParams.urlParameters.OrderIntBillOfOperationsItem = sOrderIntBillOfOperationsItem;
			oLocalModel.callFunction("/C_ManageoperationsReleaseoperation", mParams);
		},

		handleOperationHoldButton: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext();
			var oModel = oContext.getModel();
			var sOrder = oModel.getProperty("ManufacturingOrder", oContext);
			var sOrderInternalBillOfOperations = oModel.getProperty("OrderInternalBillOfOperations", oContext);
			var sOrderIntBillOfOperationsItem = oModel.getProperty("OrderIntBillOfOperationsItem", oContext);
			var sPlant = oModel.getProperty("ProductionPlant", oContext);
			var sMaterial = oModel.getProperty("Material", oContext);
			var sWorkCenter = oModel.getProperty("WorkCenter", oContext);
			this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
			this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");

			var oHoldObject = {
				ManufacturingOrder: sOrder,
				ProductionPlant: sPlant,
				Material: sMaterial,
				OrderInternalID: sOrderInternalBillOfOperations,
				OrderOperationInternalID: sOrderIntBillOfOperationsItem,
				WorkCenter: sWorkCenter
			};
			var aHoldTypesRequired = [ReuseProjectConstants.HOLD.TYPE_OPERATION, ReuseProjectConstants.HOLD.TYPE_ORDER, ReuseProjectConstants.HOLD
				.TYPE_MATERIAL, ReuseProjectConstants.HOLD.TYPE_WORKCENTER
			];
			ApplyHoldDialog.initAndOpen(oHoldObject, this.getModel("HoldModel"), aHoldTypesRequired, undefined, [ReuseProjectConstants.HOLD.TYPE_OPERATION],
				true);
		},

		getEventBusParameters: function () {
			// define events' details here for which event bus will be subscribed
			var oEventBusParams = {
				ApplyHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages2",
					Event: "onHoldSuccessfullyApplied",
					Callback: this.onHoldSuccessfullyComplete
				}
			};
			return oEventBusParams;
		},

		getReleaseEventBusParameters: function () {
			// define events' details here for which event bus will be subscribed
			var oEventBusParams = {
				ReleaseHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages2",
					Event: "onHoldSuccessfullyApplied",
					Callback: this.onReleaseHoldSuccessfullyComplete
				}
			};
			return oEventBusParams;
		},

		onHoldSuccessfullyComplete: function (sChannelId, sEventId, oResponse) {
			var sMessageText, sFinalText;
			// var aTableItems = this._osmartTable.getTable().getSelectedItems();
			if (oResponse.success) {
				this.rebindAllTablesOfAllBlocks();
				if (oResponse.info) {
					sMessageText = oResponse.info;
					MessageToast.show(sMessageText);
				}
			} else {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				sMessageText = oResponse.info;
				this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, "Error", [MessageBox.Action.CLOSE], "ErrorOrderMSG", sFinalText,
					bCompact);
			}
		},

		onReleaseHoldSuccessfullyComplete: function (sChannelId, sEventId, oResponse) {
			if (oResponse.success) {
				this.rebindAllTablesOfAllBlocks();
			}
		},

		/** 
		 * getDynamicMessageBox method gets the Message box control with dynamic inputs
		 * @public
		 * @param {string} sMessageText for initial message on message box.
		 * @param {icon} icon type for success or warning or error.
		 * @param {stitle} Title for message box.
		 * @param {Message.Action} Actions to execute after click event
		 * @param {string} id for message box.
		 * @param {string} sFinalText is final text to be displayed into message box.
		 * @param {int} length for compact style class
		 */
		getDynamicMessageBox: function (sMessageText, icon, stitle, actions, id, sFinalText, bCompact) {
			MessageBox.show(sMessageText, {
				icon: icon ? icon : MessageBox.Icon.NONE,
				title: stitle ? stitle : "",
				actions: actions ? actions : MessageBox.Action.OK,
				id: id ? id : "DefaultMessageBoxId",
				details: sFinalText ? sFinalText : "Error",
				styleClass: bCompact ? "sapUiSizeCompact" : ""
			});
		},

		getI18NText: function (isKey, aValues) {
			return this.getResourceBundle().getText(isKey, aValues);
		}

	});

});