/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller",
		"sap/i2d/mpe/lib/commons1/utils/formatter",
		"sap/ui/core/format/NumberFormat",
		"sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
		"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController",
		"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderOperationsController",
		"sap/ui/model/resource/ResourceModel",
		"sap/i2d/mpe/lib/commons1/utils/util",
		"sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus",
		"sap/i2d/mpe/lib/commons1/utils/NavHelper",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Filter",
		"sap/ui/model/json/JSONModel"
	],
	function(Controller, Formatter, NumberFormat, MaterialPopOver, ProductionOrderPopOver, OperationPopOver, ResourceModel, reuseUtil,
		OrderOperationStatus,
		NavHelper, FilterOperator, Filter, JSONModel) {
		"use strict";

		return Controller.extend("i2d.mpe.operations.manages1.blocks.OperationInProgressController", {

			formatter: Formatter,
			reuseUtil: reuseUtil,

			/**
			 * Hook Mtehod called when a controller is instantiated and its View controls (if available) are already created.
			 */

			onInit: function() {
				// Resource model is updated with the commons i18n file.
				var oI18NModel = this.loadI18NFile();

				this.getView().setModel(oI18NModel, "common_i18n");
				this.oMaterialPop = new MaterialPopOver();
				this.oProductionOrderPop = new ProductionOrderPopOver();
				this.oOperationPop = new OperationPopOver();
				this.getView().byId("idOperationInProgressTable").setIgnoreFromPersonalisation(
					"ManufacturingOrder,ManufacturingOrderSequence,ManufacturingOrderOperation,Material,MaterialName,MfgOrderOperationReadyQuantity,MfgOrderOperationText,OpPlannedTotalQuantity,OperationUnit,OpLtstSchedldExecStrtDte,OpLtstSchedldExecEndDte,OpActualExecutionStartDate,OpActualExecutionEndDate,OpPlannedScrapQuantity,OperationYieldDeviationQty,OperationHasScrapQualityIssue,OpActyConfIsSFIBased,ExecutionEndLatenessInHours,ExecutionEndLatenessInMinutes,ExecutionStartLatenessInHours,ExecutionStartLatenessInMins,OperationHasMissingComponents,OperationHasProductionHold,OperationHasScrapQualityIssue,OperationIsClosed,OperationIsConfirmed,OperationIsCreated,OperationIsDeleted,OperationIsDelivered,OperationIsPartiallyConfirmed,OperationIsPartiallyDelivered,OperationIsPrinted,OperationIsReleased,OperationIsScheduled,OperationIsTechlyCompleted,OperationStartDeviationDays,OperationStatusInternalID,OpExecutionCompletedQuantity,OpHasAssgdProdnRsceTools,PlannedEndDateDvtnInDays,WorkCenterTypeCode,MfgOrderOperationReadyQuantity,WorkCenterInternalID,OpLtstSchedldExecStrtTme,OpLtstSchedldExecStrtDte,OpLtstSchedldExecEndDte,OpLtstSchedldExecEndTme,OperationActivityNetwork,OpActyNtwkVersionCounter,SupplyArea,OpTotalConfirmedScrapQty,OperationExecutionEndIsLate,OpActyNtwkInstance"
				);
				//Counts on segmented button		
				var oViewModel;
				oViewModel = new JSONModel({
					allIssuesCount: 0,
					showOnlyHoldIssues: false,
					showOnlyRdyToFnshIssues: false
				});
				this._searchField = this.getView().byId("idOptInProgressSearchField");
				this.getView().setModel(oViewModel, "idOperationInProgressTable");
				this.oViewModel = this.getView().getModel("idOperationInProgressTable");
				this._bButtonItemClicked = true;
			},

			/** 
			 * loads the i18n file
			 * @returns ResourceModel
			 */
			loadI18NFile: function() {
				var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
				return new ResourceModel({
					bundleUrl: sI18NFilePath
				});
			},

			getTableCount: function(sWorkCenterInternalID, sProductionPlant, sQuery) {
				var sEntity = "/C_Manageoperations/$count";
				var oBindingContext = this.getView().getBindingContext();
				var sPath;
				if(oBindingContext){
					sPath = oBindingContext.getPath();
				} else {
					sPath = "/" + this.getView().getModel("DetailModel").getData().orderId;
				}
				var oOperationObject = this.getView().getModel().getContext(sPath).getObject();
				var oOperationDetailData = this.getView().getModel("DetailModel").getData();
				if(!oOperationObject && oOperationObject === undefined && oOperationDetailData.selectedOrderData){
					oOperationObject = oOperationDetailData.selectedOrderData;
				}
				var bPEOFeatureAvailable = this.formatter.getFeatureAvailability(oOperationObject.MfgFeatureIsActiveInAnyPlant);
				
				var oSearchFilterValue = new sap.ui.model.Filter({
					and: false,
					filters: [
						new Filter("ManufacturingOrder", FilterOperator.Contains, sQuery),
						new Filter("Material", FilterOperator.Contains, sQuery),
						new Filter("MaterialName", FilterOperator.Contains, sQuery)
					]
				});
				
				var aFilter1 = new sap.ui.model.Filter({
					and: false,
					filters: [
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 4),
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 6)
					]
				});

				//filter for operation with no issues
				var aFilter2 = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false)
					]
				});

				//filter for operation ready to finish
				var aFilter3 = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false),
						new sap.ui.model.Filter("OperationHasMissingComponents", sap.ui.model.FilterOperator.NE, 'X')
					]
				});

				var aOperationFilterNoIssueOperations = new sap.ui.model.Filter({
					and: true,
					filters: [
						aFilter1,
						aFilter2
					]
				});

				var aOperationFilterReadyToFinishOperations = new sap.ui.model.Filter({
					and: true,
					filters: [
						aFilter1,
						aFilter3
					]
				});
				var oWorkCenterFilter = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, sWorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, sProductionPlant)
					]
				});

				var mParameters3 = {
					filters: [
						new sap.ui.model.Filter({
							and: true,
							filters: [aFilter1, oWorkCenterFilter, oSearchFilterValue]
						})
					],
					success: function(oData) {
							var oViewModel3 = new JSONModel({
								oDataCount3: oData
							});
							this.getView().setModel(oViewModel3, "view2");
							var sTableName = this.getView().byId("idOperationInProgressFirstTable");
							sTableName.setBusy(false);
					}.bind(this),
					error: function(oError) {
						sap.m.MessageBox.error(oError);
					}
				};
				this.getView().getModel().read(sEntity, mParameters3);
				if(bPEOFeatureAvailable){
					var mParameters = {
						filters: [
							new sap.ui.model.Filter({
								and: true,
								filters: [ aOperationFilterNoIssueOperations, oWorkCenterFilter,oSearchFilterValue]
							})
						],
						success: function(oData) {
								var oViewModel = new JSONModel({
									oDataCount: oData
								});
								this.getView().setModel(oViewModel, "view1");
								var sTableName = this.getView().byId("idOperationInProgressFirstTable");
								sTableName.setBusy(false);
						}.bind(this),
						error: function(oError) {
							sap.m.MessageBox.error(oError);
						}
					};
					this.getView().getModel().read(sEntity, mParameters);
				} 
				

				var mParameters2 = {
					filters: [
						new sap.ui.model.Filter({
							and: true,
							filters: [aOperationFilterReadyToFinishOperations, oWorkCenterFilter, oSearchFilterValue]
						})
					],
					success: function(oData) {
							var oViewModel2 = new JSONModel({
								oDataCount2: oData
							});
							this.getView().setModel(oViewModel2, "view");
							var sTableName = this.getView().byId("idOperationInProgressFirstTable");
							sTableName.setBusy(false);
					}.bind(this),
					error: function(oError) {
						sap.m.MessageBox.error(oError);
					}
				};
				this.getView().getModel().read(sEntity, mParameters2);

			},

			/* Event fired just before the binding of smart table is being done. used to add the filters before binding the table
			 * @param oEvent
			 * @public
			 */

			handleBeforeRebindTable: function(oEvent) {
				var oBindingContext = oEvent.getSource().getBindingContext();
				var oBindingParams = oEvent.getParameter("bindingParams");
				oBindingParams.sorter = [new sap.ui.model.Sorter("OpActualExecutionStartDate", true)];
				// var oTableFilter = oBindingParams.filters;
				var oOperationStatusFilter = new sap.ui.model.Filter({
					and: false,
					filters: [
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 4),
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 6)
					]
				});

				if (this.returnIssueStatusValue(oEvent) === true) {
					var oIssueFilter = new sap.ui.model.Filter({
						and: false,
						filters: [
							new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false)
						]
					});
				} else if (this.returnAllRdyToFnshStatusValue(oEvent) === true) {
					var oRdyToFnshFilter = new sap.ui.model.Filter({
						and: true,
						filters: [
							new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false),
							new sap.ui.model.Filter("OperationHasMissingComponents", sap.ui.model.FilterOperator.NE, 'X')
						]
					});
				}
				var aFilters,sPath,oOperationObject;
				if (oBindingContext) {
					sPath = oBindingContext.getPath();
					oOperationObject = oEvent.getSource().getModel().getContext(sPath).getObject();
					aFilters = [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, oOperationObject.WorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, oOperationObject.ProductionPlant)
					];
				} else {
					sPath = "/" + oEvent.getSource().getModel("DetailModel").getData().orderId;
					oOperationObject = oEvent.getSource().getModel().getContext(sPath).getObject();
					if(oOperationObject){
						aFilters = [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, oOperationObject.WorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, oOperationObject.ProductionPlant)
						];
					}
				}
				var oOperationDetailData = oEvent.getSource().getModel("DetailModel").getData();
				if(!oOperationObject && oOperationObject === undefined && oOperationDetailData.selectedOrderData){
					aFilters = [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, oOperationDetailData.selectedOrderData.WorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, oOperationDetailData.selectedOrderData.ProductionPlant)
					];
					oOperationObject = oOperationDetailData.selectedOrderData;
				}
				
				var oWorkCenterPlantFilter = new sap.ui.model.Filter({
					and: true,
					filters: aFilters
				});
				var sQuery = this._searchField.getValue("");
				var oSearchFilterValue = new sap.ui.model.Filter({
					and: false,
					filters: [
						new Filter("ManufacturingOrder", FilterOperator.Contains, sQuery),
						new Filter("Material", FilterOperator.Contains, sQuery),
						new Filter("MaterialName", FilterOperator.Contains, sQuery)
					]
				});
				var oWorkCenterFilter;
				if (this.returnIssueStatusValue(oEvent) === true) {
					oWorkCenterFilter = new sap.ui.model.Filter({
						and: true,
						filters: [oOperationStatusFilter, oWorkCenterPlantFilter, oIssueFilter, oSearchFilterValue]
					});
						oBindingParams.filters.push(oWorkCenterFilter);
				} else if (this.returnAllRdyToFnshStatusValue(oEvent) === true) {
					oWorkCenterFilter = new sap.ui.model.Filter({
						and: true,
						filters: [oOperationStatusFilter, oWorkCenterPlantFilter, oRdyToFnshFilter, oSearchFilterValue]
					});
						oBindingParams.filters.push(oWorkCenterFilter);
				} else {
					oWorkCenterFilter = new sap.ui.model.Filter({
						and: true,
						filters: [oOperationStatusFilter, oWorkCenterPlantFilter, oSearchFilterValue]
					});
						oBindingParams.filters.push(oWorkCenterFilter);
				}
				if(this._bButtonItemClicked === true){
					// this.getTableCount(oOperationObject.WorkCenterInternalID, oOperationObject.ProductionPlant, this._searchField.getValue());
				} else {
					this._bButtonItemClicked = true;
				}
			},

			/** 
			 * Handler for Coverage Chart press, opens a popover which shows a legend
			 * @memberOf i2d.mpe.lib.commons1.blocks.ComponentsBlockController
			 */
			handleCoverageChartPress: function(oEvent) {
				//stopPropogation stops row level click event to be called, only control click event will be called.

				var oContext = oEvent.getSource().getBindingContext();
				var oModel = oContext.getModel();
				var oSelectedData = oModel.getContext(oContext.getPath()).getObject();
				var sQuantityValueDisplay = [];
				var sQuantityStatus = [];
				var sQuantityText = [];

				var sOpTotalConfirmedYieldQty = oSelectedData.OpTotalConfirmedYieldQty;
				var sUnitOfMeasure = oSelectedData.OperationUnit;
				if (sOpTotalConfirmedYieldQty !== undefined && sOpTotalConfirmedYieldQty >= 0) {
					sOpTotalConfirmedYieldQty = NumberFormat.getFloatInstance({}).format(sOpTotalConfirmedYieldQty);
					//var sIssue = oModel.getProperty("OpTotalConfirmedYieldQty ", oContext);
					sQuantityValueDisplay.push(sOpTotalConfirmedYieldQty);
					sQuantityStatus.push("grey");
					var sProcessed = this.getView().getModel("common_i18n").getResourceBundle().getText("processed");
					sQuantityText.push(sProcessed);
				}

				var sMfgOrderOperationReadyQuantity = oSelectedData.MfgOrderOperationReadyQuantity;
				var sReady = this.getView().getModel("common_i18n").getResourceBundle().getText("ready");
				if (sMfgOrderOperationReadyQuantity !== undefined && sMfgOrderOperationReadyQuantity >= 0) {
					sMfgOrderOperationReadyQuantity = NumberFormat.getFloatInstance({}).format(sMfgOrderOperationReadyQuantity);
					//var sIssue = oModel.getProperty("OpTotalConfirmedYieldQty ", oContext);
					sQuantityValueDisplay.push(sMfgOrderOperationReadyQuantity);
					sQuantityStatus.push("green");
					sQuantityText.push(sReady);
				} else if ((sMfgOrderOperationReadyQuantity !== undefined && sMfgOrderOperationReadyQuantity < 0)) {
					sMfgOrderOperationReadyQuantity = NumberFormat.getFloatInstance({}).format(0);
					//var sIssue = oModel.getProperty("OpTotalConfirmedYieldQty ", oContext);
					sQuantityValueDisplay.push(sMfgOrderOperationReadyQuantity);
					sQuantityStatus.push("green");
					sQuantityText.push(sReady);
				}

				var sMfgOrderOperationNotReadyQuantity = oSelectedData.MfgOrderOperationNotReadyQty;
				var sNotReady = this.getView().getModel("common_i18n").getResourceBundle().getText("notReady");
				if (sMfgOrderOperationNotReadyQuantity !== undefined && sMfgOrderOperationNotReadyQuantity >= 0) {
					sMfgOrderOperationNotReadyQuantity = NumberFormat.getFloatInstance({}).format(sMfgOrderOperationNotReadyQuantity);
					sQuantityValueDisplay.push(sMfgOrderOperationNotReadyQuantity);
					sQuantityStatus.push("orange");
					sQuantityText.push(sNotReady);
				} else if ((sMfgOrderOperationNotReadyQuantity !== undefined && sMfgOrderOperationNotReadyQuantity < 0)) {
					sMfgOrderOperationNotReadyQuantity = NumberFormat.getFloatInstance({}).format(0);
					sQuantityValueDisplay.push(sMfgOrderOperationNotReadyQuantity);
					sQuantityStatus.push("orange");
					sQuantityText.push(sNotReady);
				}

				//var sIssueText = [sIssue];

				reuseUtil.openStackedBarChartPopover2(this, oEvent, sQuantityValueDisplay, sQuantityStatus, sQuantityText, sUnitOfMeasure);

			},

			/** 
			 * Event Handler for icon press, opens a popover which shows the details of the Issues
			 * @param oEvent
			 */
			handleIconPress: function(oEvent) {
				var oColor = oEvent.getSource().getColor();
				if (oColor === "#d9d9d9") {
					return "";
				} else {
					var aWcQueue = true;
					reuseUtil.openIssuePopOver(oEvent, this, aWcQueue);
				}

			},

			/** 
			 * Event Handler for Material link press, opens a popover which shows the details of the material
			 * @param oEvent
			 */
			handleMaterialLinkPress: function(oEvent) {
				var oContext = oEvent.getSource().getBindingContext();
				var oModel = oContext.getModel();
				var sProductionPlant = oModel.getProperty("ProductionPlant", oContext);
				var sMaterial = oModel.getProperty("Material", oContext);
				// var sMRPArea = oModel.getProperty("MRPArea", oContext) || oModel.getProperty("ProductionPlant", oContext);
				this.oMaterialPop.openMaterialPopOver(oEvent, this, sMaterial, sProductionPlant);
			},

			/** 
			 * Handler for Ordr Number link press, opens a popover which shows the details of the Order
			 * @param oEvent
			 */
			handleOrderNumberPress: function(oEvent) {
				var oSource = oEvent.getSource();
				var sPath = oSource.getBindingContext().sPath;
				var oProperty = oSource.getModel().getProperty(sPath);
				var sManufacturingOrderId = oProperty.ManufacturingOrder || oProperty.MRPElement;
				this.oProductionOrderPop.openProdOrdPopOver(oEvent, this, sManufacturingOrderId);
			},

			handleOperationPress: function(oEvent) {
				var oContext = oEvent.getSource().getBindingContext();
				var oModel = oContext.getModel();
				var sOrderInternalBillOfOperations = oModel.getProperty("OrderInternalID", oContext);
				var sOrderIntBillOfOperationsItem = oModel.getProperty("OrderOperationInternalID", oContext);
				this.oOperationPop.openOperationsPopOver(oEvent, this, sOrderInternalBillOfOperations, sOrderIntBillOfOperationsItem);
			},

			/**
			 * Event Handler for the table item press
			 * @param oEvent object to provides the event handler parameter
			 */
			handleOperationSelect: function(oEvent) {
				var sPath = oEvent.getParameter("listItem").getBindingContextPath();

				var oObjectInstance = reuseUtil.getObjectPageRefrence();
				if (oObjectInstance && oObjectInstance.getRouter()) {
					var oRouter = oObjectInstance.getRouter();
					var iAppState = oObjectInstance.iAppState;
					oRouter.navTo("object", {
						operationId: sPath.substr(1),
						iAppState: iAppState
					}, false);

				} else {
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNavigator.toExternal({
						target: {
							shellHash: "#ManufacturingOrderOperation-manage&/ManageOperations" + sPath
						}
					});
				}
			},

			/**
			 * Event Handler for the Search
			 * @param oEvent 
			 * @public
			 */
			_filter: function() {
				var oFilter = null;

				if (this._oGlobalFilter) {
					oFilter = this._oGlobalFilter;
				}

				this.getView().byId("idOperationInProgressFirstTable").getBinding("items").filter(oFilter, "Application");
			},

			/**
			 * Event Handler for the Search
			 * @param oEvent 
			 * @public
			 */
			handleOrdersSearch: function(oEvent) {
				// var sEntity = "/C_Manageoperations/$count";
				// create model filter
				var sQuery = oEvent.getParameter("query");
				this._oGlobalFilter = null;
				this.getSearchTableCount(sQuery, oEvent.getSource().getBindingContext(), this.getView().getModel());
				var sPath = oEvent.getSource().getBindingContext().getPath();
				var oOperationObject = this.getView().getModel().getContext(sPath).getObject();
				// this.getTableCount(oOperationObject.WorkCenterInternalID, oOperationObject.ProductionPlant, this._searchField.getValue());
				// this.goAllOpTable = this.getView().byId("idOperationInProgressTable");
				// this.goAllOpTable.rebindTable();
			},
			
			getSearchTableCount : function(sQuery, oBindingContext, oDataModel){
				var oMaterialFilter = new sap.ui.model.Filter({
					and: false,
					filters: [
						new Filter("ManufacturingOrder", FilterOperator.Contains, sQuery),
						new Filter("Material", FilterOperator.Contains, sQuery),
						new Filter("MaterialName", FilterOperator.Contains, sQuery)
					]
				});
				var aFilter1 = new sap.ui.model.Filter({
					and: false,
					filters: [
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 4),
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 6)
					]
				});
				//filter for operation with no issues
				var aOperationFilterNoIssueOperations = new sap.ui.model.Filter({
					and: false,
					filters: [
						new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false)
					]
				});
				//filter for operation ready to finish
				var aOperationFilterReadyToFinishOperations = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false),
						new sap.ui.model.Filter("OperationHasMissingComponents", sap.ui.model.FilterOperator.NE, 'X')
					]
				});
				// var aOperationFilterNoIssueOperations = new sap.ui.model.Filter({
				// 	and: true,
				// 	filters: [
				// 		aFilter1,
				// 		aFilter2
				// 	]
				// });
				// var aOperationFilterReadyToFinishOperations = new sap.ui.model.Filter({
				// 	and: true,
				// 	filters: [
				// 		aFilter1,
				// 		aFilter3
				// 	]
				// });
				var sPath = oBindingContext.getPath();
				var oOperationObject = oDataModel.getContext(sPath).getObject();
				var oWorkCenterFilter = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, oOperationObject.WorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, oOperationObject.ProductionPlant)
					]
				});
				//to find which toggle button is in use right now 
				if (this.returnIssueStatusValue() === true) {
					this._oGlobalFilter = new Filter({
						and: true,
						filters: [aFilter1, oWorkCenterFilter, aOperationFilterNoIssueOperations, oMaterialFilter]
					});

					this._filter();
				} else if (this.returnAllRdyToFnshStatusValue() === true) {
					this._oGlobalFilter = new Filter({
						and: true,
						filters: [aFilter1, oWorkCenterFilter, aOperationFilterReadyToFinishOperations, oMaterialFilter]
					});

					this._filter();
				} else {
					this._oGlobalFilter = new Filter({
						and: true,
						filters: [aFilter1, oWorkCenterFilter, oMaterialFilter]
					});
					this._filter();
				}
			},

			/** 
			 * Handler for status link press, opens a popover which shows the order status information
			 * @param oEvent
			 */
			handleStatusLinkPress: function(oEvent) {
				OrderOperationStatus.openStatusPopOver(oEvent, this);
			},

			/** 
			 * Handler for item selection -> navigate to following apps in worker ui or operation
			 * @param oEvent
			 */
			handleItemSelect: function(oEvent) {
				var sPath = oEvent.getParameter("listItem").getBindingContextPath();
				var sTableName = this.getView().byId("idOperationInProgressFirstTable");
				sTableName.setBusy(true);
				var oModel = this.getView().getModel();
				var oObject = oModel.getProperty(sPath);
				var sOrder = oObject.ManufacturingOrder;
				var sOperation = oObject.ManufacturingOrderOperation;
				var sOrderStatus = oObject.OperationStatusInternalID;

				var sMessageBoxHeader = this.getView().getModel("common_i18n").getResourceBundle().getText("messageBoxHeader");
				var sMessageBoxText = this.getView().getModel("common_i18n").getResourceBundle().getText("messageBoxMessage");

				if (this.getView().getModel("objectView").oData.workCenterQueue) {
					if (sOrderStatus === "01") {
						sap.m.MessageBox.information(sMessageBoxText, {
							title: sMessageBoxHeader
						});
						sTableName.setBusy(false);
					} else {
						NavHelper.navFromOrderEntry(this, sOrder, sOperation, sTableName);
					}
				} else {
					this.handleOperationSelect(oEvent);
				}
			},

			//method called when data is received by table		
			onDataReceived: function(oEvent) {
				var aComponents = oEvent.getParameters().getParameters().data.results;
				var length = aComponents.length;
				//all count		
				if (this.returnIssueStatusValue(oEvent) === false && this.returnAllRdyToFnshStatusValue(oEvent) === false) {
					this.getView().getModel("idOperationInProgressTable").setProperty("/allIssuesCount", this.getallOperationsCount(oEvent));
				}
				this.getView().getModel("idOperationInProgressTable").setProperty("/holdIssueCount", this.getOnlyIssuesCount(oEvent));
			},
			/**         		
			 * Event Handler For SegmentedButton		
			 * @memberOf i2d.mpe.lib.commons1.blocks.ComponentsBlockController		
			 * @public 		
			 */
			handleOperationsBtnPress: function() {
				this.goAllOpTable = this.getView().byId("idOperationInProgressTable");
				this.goAllOpTable.rebindTable();
			},
			//returns status value, used for toggle buttons		
			returnIssueStatusValue: function(oEvent) {
				var oIssueStatusModel = this.getView().getModel("idOperationInProgressTable");
				var oIssueStatus = oIssueStatusModel.getData();
				return oIssueStatus.showOnlyHoldIssues;
			},

			//returns ready to finish status value, used for toggle buttons				
			returnAllRdyToFnshStatusValue: function(oEvent) {
				var oIssueStatusModel = this.getView().getModel("idOperationInProgressTable");
				var oIssueStatus = oIssueStatusModel.getData();
				return oIssueStatus.showOnlyRdyToFnshIssues;
			},

			//function to calculate count for all operations		
			getallOperationsCount: function(oEvent) {
			  /*  Commented this sectio because total row count is not calculated using oDataCount3 & _getRowCount can not be used since its an private method
				var oModel = this.getView().getModel("DetailModel");
				var oOperationDetailData = oModel.getData();
				var sObjectPageFlag = oOperationDetailData.objectPageFlag;
				var totalCount = this.getView().byId("idOperationInProgressTable");
				if (totalCount._getRowCount() > 0) {
					return totalCount._getRowCount();
				} else {
					return "0";
				}*/
			},
			//function to show all operations		
			showAllOperations: function(oEvent) {
				this.getView().getModel("idOperationInProgressTable").setProperty("/showOnlyHoldIssues", false);
				this.getView().getModel("idOperationInProgressTable").setProperty("/showOnlyRdyToFnshIssues", false);
				this._bButtonItemClicked = false;
				// this._searchField.getValue("");
				this.getSearchTableCount(this._searchField.getValue(), this.getView().getBindingContext(), this.getView().getModel());
				// this._searchField.search("");
				
			},
			//function to calculate count for operations with issues		
			getOnlyIssuesCount: function(oEvent) {},
			//function to show all operations with issues		
			showAllIssueOperations: function(oEvent) {
				this.getView().getModel("idOperationInProgressTable").setProperty("/showOnlyHoldIssues", true);
				this._bButtonItemClicked = false;
				// this._searchField.getValue("");
				this.getSearchTableCount(this._searchField.getValue(), this.getView().getBindingContext(), this.getView().getModel());
				// this._searchField.search("");
			},
			//function to show all operations with ready to finish status				
			showAllRdyToFnshIssuesOperations: function(oEvent) {
				this.getView().getModel("idOperationInProgressTable").setProperty("/showOnlyHoldIssues", false);
				this.getView().getModel("idOperationInProgressTable").setProperty("/showOnlyRdyToFnshIssues", true);
				this._bButtonItemClicked = false;
				// this._searchField.getValue("");
				this.getSearchTableCount(this._searchField.getValue(), this.getView().getBindingContext(), this.getView().getModel());
				// this._searchField.search("");
			}

		});
	});