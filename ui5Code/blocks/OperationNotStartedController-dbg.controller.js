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
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox"
	],
	function(Controller, Formatter, NumberFormat, MaterialPopOver, ProductionOrderPopOver, OperationPopOver, ResourceModel, reuseUtil,
		OrderOperationStatus,
		NavHelper, FilterOperator, Filter, JSONModel, MessageBox) {
		"use strict";

		return Controller.extend("i2d.mpe.operations.manages1.blocks.OperationNotStartedController", {

			formatter: Formatter,
			reuseUtil: reuseUtil,

			/**
			 * Hook Mtehod called when a controller is instantiated and its View controls (if available) are already created.
			 */
			onInit: function() {
				// Initializing popover instances
				this.oMaterialPop = new MaterialPopOver();
				this.oProductionOrderPop = new ProductionOrderPopOver();
				this.oOperationPop = new OperationPopOver();
				// Resource model is updated with the commons i18n file.
				var oI18NModel = this.loadI18NFile();
				this.getView().setModel(oI18NModel, "common_i18n");
				this.getView().byId("idOperationNotStartedTable").setIgnoreFromPersonalisation(
					"ManufacturingOrder,ManufacturingOrderSequence,ManufacturingOrderOperation,Material,MaterialName,MfgOrderOperationText,OpPlannedTotalQuantity,OperationUnit,OpLtstSchedldExecStrtDte,OpLtstSchedldExecEndDte,OpActualExecutionStartDate,OpActualExecutionEndDate,OpPlannedScrapQuantity,OperationYieldDeviationQty,OperationHasScrapQualityIssue,ExecutionEndLatenessInHours,ExecutionEndLatenessInMinutes,ExecutionStartLatenessInHours,ExecutionStartLatenessInMins,OpExecutionCompletedQuantity,OpHasAssgdProdnRsceTools,OperationHasMissingComponents,OperationHasProductionHold,OperationIsClosed,OperationIsConfirmed,OperationIsCreated,OperationIsDeleted,OperationIsDelivered,OperationIsPartiallyConfirmed,OperationIsPartiallyDelivered,OperationIsPrinted,OperationIsReleased,OperationIsScheduled,OperationIsTechlyCompleted,OperationStartDeviationDays,OperationStatusInternalID,PlannedEndDateDvtnInDays,WorkCenterTypeCode"
				);

				//Counts on segmented button		
				var oViewModel;
				oViewModel = new JSONModel({
					allIssuesCount: 0,
					showOnlyReleasedIssues: false,
					showOnlyRdyToStrtIssues: false
				});
				this.getView().setModel(oViewModel, "idOperationNotStartedTable");
				this.oViewModel = this.getView().getModel("idOperationNotStartedTable");
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

			/**
			 * Hook Mehtod invoked before the controller's View is re-rendered
			 */
			onBeforeRendering: function() {},

			/**
			 * Hook Method Called when the View has been rendered. Post-rendering manipulations of the HTML could be done here.
			 */
			getTableCount: function(sWorkCenterInternalID, sProductionPlant, sQuery) {
				var sEntity = "/C_Manageoperations/$count";
				var oSearchFilterValue = new sap.ui.model.Filter({
					and: false,
					filters: [
						new Filter("ManufacturingOrder", FilterOperator.Contains, sQuery),
						new Filter("Material", FilterOperator.Contains, sQuery),
						new Filter("MaterialName", FilterOperator.Contains, sQuery)
					]
				});
				var aOperationFilterAllOperations = this.getAllOperationFilter();
				
				var aOperationFilterReadyToStartOperations = this.getAllOperationReadyFilter();
				//filter for operation with released status
				var aOperationFilterRelOperations = this.getAllOperationReleaseFilter();
				var oWorkCenterFilter = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, sWorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, sProductionPlant)
					]
				});
				//to find count on all operations
				var mParameters3 = {
					filters: [
						new sap.ui.model.Filter({
							and: true,
							filters: [ aOperationFilterAllOperations, oWorkCenterFilter, oSearchFilterValue]
						})
					],
					success: function(oData) {
							var oViewModel3 = new JSONModel({
								oDataCount3: oData
							});
							this.getView().setModel(oViewModel3, "view2");
							var sTableName = this.getView().byId("idOperationNotStartedFirstTable");
							sTableName.setBusy(false);
					}.bind(this),
					error: function(oError) {
						sap.m.MessageBox.error(oError);
					}
				};
				this.getView().getModel().read(sEntity, mParameters3);
				var mParameters = {
					filters: [
						new sap.ui.model.Filter({
							and: true,
							filters: [aOperationFilterRelOperations, oWorkCenterFilter, oSearchFilterValue]
						})
					],
					success: function(oData) {
							var oViewModel = new JSONModel({
								oDataCount: oData
							});
							this.getView().setModel(oViewModel, "view1");
							var sTableName = this.getView().byId("idOperationNotStartedFirstTable");
							sTableName.setBusy(false);
					}.bind(this),
					error: function(oError) {
						sap.m.MessageBox.error(oError);
					}
				};
				this.getView().getModel().read(sEntity, mParameters);
				var mParameters2 = {
					filters: [
						new sap.ui.model.Filter({
							and: true,
							filters: [aOperationFilterReadyToStartOperations, oWorkCenterFilter, oSearchFilterValue]
						})
					],
					success: function(oData) {
							var oViewModel2 = new JSONModel({
								oDataCount2: oData
							});
							this.getView().setModel(oViewModel2, "view");
							var sTableName = this.getView().byId("idOperationNotStartedFirstTable");
							sTableName.setBusy(false);
					}.bind(this),
					error: function(oError) {
						sap.m.MessageBox.error(oError);
					}
				};
				this.getView().getModel().read(sEntity, mParameters2);
			},

			/** 
			 * Handler for Coverage Chart press, opens a popover which shows a legend
			 * @memberOf i2d.mpe.lib.commons1.blocks.ComponentsBlockController
			 */

			handleCoverageChartPress: function(oEvent) {
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
			 * To retrive the current operation id from the global model.
			 */

			getOperationIdFromGlobalTransportModel: function() {
				var oModel = this.getView().getModel("DetailModel");
				var oOperationDetailData = oModel.getData();
				this.OrderId = oOperationDetailData.orderId;
				var a = oOperationDetailData.WorkCenter;

			},

			/** 
			 * Event fired just before the binding of smart table is being done. used to add the filters before binding the table
			 * @param oEvent
			 * @public
			 */
			handleBeforeRebindTable: function(oEvent) {
				var oBindingContext = oEvent.getSource().getBindingContext();
				var sQuery = this.getView().byId("idSearchField").getValue();
				var sPath;
				if(oBindingContext){
					sPath = oBindingContext.getPath();
				} else {
					sPath = "/" + this.getView().getModel("DetailModel").getData().orderId;
				}
				// var sPath = oBindingContext.getPath();
				var oOperationObject = oEvent.getSource().getModel().getContext(sPath).getObject();
				var oOperationDetailData = this.getView().getModel("DetailModel").getData();
				if(!oOperationObject && oOperationObject === undefined && oOperationDetailData.selectedOrderData){
					oOperationObject = oOperationDetailData.selectedOrderData;
				}
				var oFilter = new sap.ui.model.Filter([], true);
				var mBindingParams = oEvent.getParameter("bindingParams");
				mBindingParams.sorter = [new sap.ui.model.Sorter("OpLtstSchedldExecStrtDte")];
				var oTableFilter = mBindingParams.filters;
				// var sBasicSearchText = this.getView().byId("idSearchField").getValue();
				// if (sBasicSearchText) {
				// 	mBindingParams.parameters["custom"] = {
				// 		"search": sBasicSearchText //  the search text itself! 
				// 	};
				// }
				var oSearchFilterValue = new sap.ui.model.Filter({
					and: false,
					filters: [
						new Filter("ManufacturingOrder", FilterOperator.Contains, sQuery),
						new Filter("Material", FilterOperator.Contains, sQuery),
						new Filter("MaterialName", FilterOperator.Contains, sQuery)
					]
				});
				var aOperationFilterAllOperations = this.getAllOperationFilter();
	
			var oWorkCenterPlantFilter = new sap.ui.model.Filter({
				and: true,
				filters: [
					new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, oOperationObject.WorkCenterInternalID),
					new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, oOperationObject.ProductionPlant)
				]
			});
			
			if (this.returnRelStatusValue(oEvent) === true) {
				var aOperationFilterRelOperations = this.getAllOperationReleaseFilter();
			} else if (this.returnAllRdyToStrtStatusValue(oEvent) === true) {
				var aOperationFilterReadyToStartOperations = this.getAllOperationReadyFilter();
			}
			if (this.returnRelStatusValue(oEvent) === true) {
				oFilter.aFilters.push(aOperationFilterAllOperations, oWorkCenterPlantFilter, aOperationFilterRelOperations, oSearchFilterValue);
				oTableFilter.push(oFilter);
			} else if (this.returnAllRdyToStrtStatusValue(oEvent) === true) {
				oFilter.aFilters.push(aOperationFilterAllOperations, oWorkCenterPlantFilter, aOperationFilterReadyToStartOperations, oSearchFilterValue);
				oTableFilter.push(oFilter);
			} else {
				oFilter.aFilters.push(aOperationFilterAllOperations, oWorkCenterPlantFilter, oSearchFilterValue);
				oTableFilter.push(oFilter);
			}
			if(this._bButtonItemClicked === true){
				// this.getTableCount(oOperationObject.WorkCenterInternalID, oOperationObject.ProductionPlant, sQuery);
			} else {
				this._bButtonItemClicked = true;
			}
				
			},

			//method called when data is received by table		
			/*	onDataReceived: function(oEvent) {
					var aComponents = oEvent.getParameters().getParameters().data.results;
					var length = aComponents.length;
					//all count		
					if (this.returnRelStatusValue(oEvent) === false && this.returnAllRdyToStrtStatusValue(oEvent) === false) {
						this.getView().getModel("idOperationNotStartedTable").setProperty("/allIssuesCount", this.getallOperationsCount(oEvent));
					}
					//this.getView().getModel("idOperationNotStartedTable").setProperty("/holdIssueCount", this.getOnlyIssuesCount(oEvent));
				},*/

			//returns released status value, used for toggle buttons		
			returnRelStatusValue: function(oEvent) {
				var oIssueStatusModel = this.getView().getModel("idOperationNotStartedTable");
				var oIssueStatus = oIssueStatusModel.getData();
				return oIssueStatus.showOnlyReleasedIssues;
			},

			//returns ready to start status value, used for toggle buttons				
			returnAllRdyToStrtStatusValue: function(oEvent) {
				var oIssueStatusModel = this.getView().getModel("idOperationNotStartedTable");
				var oIssueStatus = oIssueStatusModel.getData();
				return oIssueStatus.showOnlyRdyToStrtIssues;
			},

			//function to calculate count for all operations		
			/*	getallOperationsCount: function(oEvent) {
					if (this.returnRelStatusValue(oEvent) === false) {
						var totalCount = this.getView().byId("idOperationNotStartedTable");
						if (totalCount._getRowCount() > 0) {
							return totalCount._getRowCount();
						} else {
							return "0";
						}
					}
				},*/

			//function to show all operations		
			showAllOperations: function(oEvent) {
				this.getView().getModel("idOperationNotStartedTable").setProperty("/showOnlyReleasedIssues", false);
				this.getView().getModel("idOperationNotStartedTable").setProperty("/showOnlyRdyToStrtIssues", false);
				this._bButtonItemClicked = false;
				this.getSearchTableCount(this.getView().byId("idSearchField").getValue(), this.getView().getBindingContext(), this.getView().getModel());
			},

			//function to show all operations with issues		
			showAllReleasedOperations: function(oEvent) {
				this.getView().getModel("idOperationNotStartedTable").setProperty("/showOnlyReleasedIssues", true);
				this._bButtonItemClicked = false;
				this.getSearchTableCount(this.getView().byId("idSearchField").getValue(), this.getView().getBindingContext(), this.getView().getModel());
			},
			//function to show all operations with ready to finish status				
			showAllRdyToStrtIssuesOperations: function(oEvent) {
				this.getView().getModel("idOperationNotStartedTable").setProperty("/showOnlyReleasedIssues", false);
				this.getView().getModel("idOperationNotStartedTable").setProperty("/showOnlyRdyToStrtIssues", true);
				this._bButtonItemClicked = false;
				this.getSearchTableCount(this.getView().byId("idSearchField").getValue(), this.getView().getBindingContext(), this.getView().getModel());
			},

			/**         		
			 * Event Handler For SegmentedButton		
			 * @public 		
			 */
			handleOperationsBtnPress: function() {
				this.goAllOpTable = this.getView().byId("idOperationNotStartedTable");
				this.goAllOpTable.rebindTable();
			},

			/** 
			 * Press event handler of segmented button
			 */
			handleSegmntBtnPress: function() {
				this.oSmartTable = this.getView().byId("idOperationNotStartedTable");
				this.oSmartTable.rebindTable();
			},

			/** 
			 * Event handler on press event of icon. opens the issues popup
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
			 * Handler for Material link press, opens a popover which shows the details of the material
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
			 * Handler for Order Number link press, opens a popover which shows the details of the Order
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
			 * @param oEvent 
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

				this.getView().byId("idOperationNotStartedFirstTable").getBinding("items").filter(oFilter, "Application");
			},

			/**
			 * Event Handler for the Search
			 * @param oEvent 
			 * @public
			 */
			handleOrdersSearch: function(oEvent) {
				var oBindingContext = oEvent.getSource().getBindingContext();
				// create model filter
				var sQuery = oEvent.getParameter("query");
				this._oGlobalFilter = null;
				this.getSearchTableCount(sQuery, oBindingContext, this.getView().getModel());
				// var sQuery = this.getView().byId("idSearchField").getValue();
				var sPath = oBindingContext.getPath();
				var oOperationObject = this.getView().getModel().getContext(sPath).getObject();
				// this.getTableCount(oOperationObject.WorkCenterInternalID, oOperationObject.ProductionPlant, sQuery);
			},
			
			/** 
			 * Isolated method To add filters to the table.
			 */
			getSearchTableCount: function(sQuery, oBindingContext, oDataModel){
				var oMaterialFilter = new sap.ui.model.Filter({
					and: false,
					filters: [
						new Filter("ManufacturingOrder", FilterOperator.Contains, sQuery),
						new Filter("Material", FilterOperator.Contains, sQuery),
						new Filter("MaterialName", FilterOperator.Contains, sQuery)
					]
				});
				var aOperationFilterAllOperations = this.getAllOperationFilter();
				
				var aOperationFilterReadyToStartOperations = this.getAllOperationReadyFilter();
				//filter for operation with released status
				var aOperationFilterRelOperations = this.getAllOperationReleaseFilter();
				var sPath = oBindingContext.getPath();
				var oOperationObject = oDataModel.getContext(sPath).getObject();
				var oWorkCenterFilter = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("WorkCenterInternalID", sap.ui.model.FilterOperator.EQ, oOperationObject.WorkCenterInternalID),
						new sap.ui.model.Filter("ProductionPlant", sap.ui.model.FilterOperator.EQ, oOperationObject.ProductionPlant)
					]
				});
				if (this.returnRelStatusValue() === true) {
					this._oGlobalFilter = new Filter({
						and: true,
						filters: [oMaterialFilter, aOperationFilterRelOperations, oWorkCenterFilter]
					});
					this._filter();
				} else if (this.returnAllRdyToStrtStatusValue() === true) {
					this._oGlobalFilter = new Filter({
						and: true,
						filters: [oMaterialFilter, aOperationFilterReadyToStartOperations, oWorkCenterFilter]
					});
					this._filter();
				} else {
					this._oGlobalFilter = new Filter({
						and: true,
						filters: [oMaterialFilter, aOperationFilterAllOperations, oWorkCenterFilter]
					});
					this._filter();
				}
			},

			/** 
			 * Event Handler for status link press, opens a popover which shows the order status information
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
				var sTableName = this.getView().byId("idOperationNotStartedFirstTable");
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
			
			getAllOperationFilter: function(){
				var oFilter1 =  new sap.ui.model.Filter({
					and: false,
					filters: [
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 1),
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 2),
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 3)
					]
				});
				return oFilter1;
			},
			
			getAllOperationReadyFilter: function(){
				var oFilter1 = new sap.ui.model.Filter({
					and: false,
					filters: [
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 2),
						new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, 3)
					]
				});
				var aFilter2 = new sap.ui.model.Filter({
					and: true,
					filters: [
						new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, false),
						new sap.ui.model.Filter("OperationHasMissingComponents", sap.ui.model.FilterOperator.NE, 'X')
					]
				});
				var oFilter3 = new sap.ui.model.Filter({
					and: true,
					filters: [
						oFilter1,
						aFilter2
					]
				});
				return oFilter3;
			},
			
			getAllOperationReleaseFilter: function(){
				var aFilter1 = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("OperationIsReleased", sap.ui.model.FilterOperator.EQ, 'X')
					]
				});
				var oFilter2 = this.getAllOperationFilter();
				var oFilter3 = new sap.ui.model.Filter({
					and: true,
					filters: [
						oFilter2,
						aFilter1
					]
				});
				return oFilter3;
			}
		});
	});