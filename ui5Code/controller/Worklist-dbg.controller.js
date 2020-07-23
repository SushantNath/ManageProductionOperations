/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"i2d/mpe/operations/manages2/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"i2d/mpe/operations/manages2/model/formatter",
	"sap/ui/model/Filter",
	"sap/i2d/mpe/lib/aors1/AOR/AORFragmentHandler",
	"sap/i2d/mpe/lib/popovers1/fragments/IssuePopOverController",
	"sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
	"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController",
	"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderOperationsController",
	"sap/i2d/mpe/lib/popovers1/fragments/WorkCenterController",
	"sap/i2d/mpe/lib/commons1/utils/saveAsTile",
	"sap/i2d/mpe/lib/commons1/utils/util",
	"sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog",
	"sap/i2d/mpe/lib/commons1/utils/constants",
	"sap/i2d/mpe/lib/commons1/fragments/OrdSpcfcChange",
	"sap/i2d/mpe/lib/commons1/utils/NavHelper"
], function (BaseController, JSONModel, formatter, Filter, AORReuse, IssuePopOver, MaterialPopOver, ProductionOrderPopOver,
	ProductionOrderOperationPopOver, WorkCenterPopOver, TileManagement, ReuseUtil, OrderOperationStatus, MessageToast, MessageBox,
	ApplyHoldDialog, ReuseProjectConstants, OrdSpcfcChange, NavHelper) {
	"use strict";

	return BaseController.extend("i2d.mpe.operations.manages2.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* Lifecycle Methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {

			// flag to check if AOR filter has been applied on smart table
			this.bAORFilterFlag = false;
			this.bAORDeleted = false;
			this.bOnAfterRenderExecuted = false;
			this.bPersServiceExecuted = false;
			// getting instance of all the smart controls 
			this._oSmartFilter = this.getView().byId("idSmartFilterBar");
			this._oVariantMgt = this.getView().byId("idSmartVManagement");
			this._osmartTable = this.getView().byId("idMonitorOperationsTable");
			this._oOperationOrderReleaseButton = this.getView().byId("idOperationOrderReleaseButton");
			// this._oEditButton = this.getView().byId("idEditButton");
			// this._oHoldButton = this.getView().byId("idOperationHoldButton");
			var that = this;
			// get the personalization container to check if AOR is assigned

			sap.ushell.Container.getService("Personalization").getContainer("i2d.mpe.Supervisor")
				.done(function (oContainer) {
					that.bPersServiceExecuted = true;
					if (oContainer.getItemValue("AssignedSupervisors")) {
						that.AssignedSupervisor = oContainer.getItemValue("AssignedSupervisors");
					}
					if (oContainer.getItemValue("AssignedWorkcenters")) {
						that.AssignedWorkcenter = oContainer.getItemValue("AssignedWorkcenters");
					}
					if (that.bOnAfterRenderExecuted) {
						that.loadAORData();
					}
				});

			var oEventBus = sap.ui.getCore().getEventBus();

			// Subcribe for events from ApplyHoldDailog for Apply Hold funcionality
			var oEventBusParams = this.getEventBusParameters();
			oEventBus.subscribe(oEventBusParams.ApplyHoldDialog.Channel, oEventBusParams.ApplyHoldDialog.Event, oEventBusParams.ApplyHoldDialog
				.Callback, this);

			// ignoring fields from smart table personalisation
			this._osmartTable.setIgnoreFromPersonalisation(
				"ManufacturingOrder,Material,WorkCenter,OpLtstSchedldExecStrtDte,OpLtstSchedldExecStrtTme,OpLtstSchedldExecEndDte,OpLtstSchedldExecEndTme,OpActualExecutionStartDate,OpActualExecutionStartTime,OpActualExecutionEndDate,OpActualExecutionEndTime"
			);
			// reading startup parameters to get the variant ID
			this.sSelectedVariant = "";
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			var oComponent = sap.ui.component(sComponentId);
			if (oComponent && oComponent.getComponentData() && oComponent.getComponentData().startupParameters && oComponent.getComponentData()
				.startupParameters.VariantID) {
				this.sSelectedVariant = decodeURIComponent(oComponent.getComponentData().startupParameters.VariantID[0]);
			}

			this.getRouter().getRoute("worklist").attachPatternMatched(this.handleRouteMatched, this);
			oEventBus.subscribe("AppState", "handleAppstateChanges", this.handleAppStateChanges, this);

			// Initializing popover instances
			this.oMaterialPop = new MaterialPopOver();
			this.oProductionOrderOperationPop = new ProductionOrderOperationPopOver();
			this.oProductionOrderPop = new ProductionOrderPopOver();
			this.oWorkCenterPop = new WorkCenterPopOver();
			ReuseUtil.setWorklistCtrlReference(this);
			this.getOwnerComponent().setModel(new JSONModel({
				EditButtonNavigable: true,
				EditButtonVisible: false,
				ConfirmButtonVisible: true,
				bIsHoldButtionVisible: false,
				bIsOrderSpecificHoldAvailable: false,
				bIsOrderSpecificHoldVisible: false,
				bIsDisplayOrderSpecificHoldAvailable: true,
				bIsDisplayOrderSpecificHoldVisible: false
			}), "ActionButtonVisiblity");
			//Visibility of edit button
			if (sap.ushell && sap.ushell.Container) {
				var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
				var aSemantic = [];
				// var oSemanticProductionOrderChange = "#ProductionOrder-change"; //Intent-action
				// aSemantic.push(oSemanticProductionOrderChange);
				// var oSemanticProductionOrderConfirmation = "; //Intent-action
				aSemantic.push("#ProductionOrderConfirmation-createTimeTicket", "#ProductionOrder-change", "#ShopFloorRouting-change");
				oService.isIntentSupported(aSemantic).done(function (oCheck) {
					if (oCheck) {
						// var visibility = {
						// 	editOrder: false,
						// 	confirmOrder: false
						// };
						// visibility.editOrder = oCheck["#ProductionOrder-change"].supported;
						// visibility.confirmOrder = oCheck["#ProductionOrderConfirmation-createTimeTicket"].supported;

						// var oButtonData = {
						// 	EditButtonNavigable: visibility.editOrder,
						// 	ConfirmButtonVisible: visibility.confirmOrder
						// };
						// this.setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
						// this.getOwnerComponent().setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
						this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/EditButtonNavigable", oCheck[
								"#ProductionOrder-change"]
							.supported);
						this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/ConfirmButtonVisible", oCheck[
							"#ProductionOrderConfirmation-createTimeTicket"].supported);

						this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", oCheck[
							"#ShopFloorRouting-change"].supported);
					}
				}.bind(this)).
				fail(function () {
					// var oButtonData = {
					// 	EditButtonNavigable: true,
					// 	ConfirmButtonVisible: true
					// };
					// this.setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
					// this.getOwnerComponent().setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
					// this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/EditButtonNavigable", true);
					// this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/ConfirmButtonVisible", true);
					jQuery.sap.log.error("Reading intent data failed.");
				});
			} else {
				// var oButtonData = {
				// 	EditButtonNavigable: true,
				// 	ConfirmButtonVisible: true
				// };
				// this.setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
				// this.getOwnerComponent().setModel(new JSONModel(oButtonData), "ActionButtonVisiblity");
				// this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/EditButtonNavigable", true);
				// this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/ConfirmButtonVisible", true);
				jQuery.sap.log.error("ushell not available");
			}

		},

		/** 
		 * 
		 * ApplyFilterOnAOR method applies the filter based on the AOR selected.This method gets called from reuse library project when there is any change in AOR.
		 * @public
		 * @param {obejct} oSelectedSupervisor AOR Selection containing selected Supervisor Information 
		 * @param {obejct} oSelectedWorkcenter AOR Selection containing selected WorkCenter Information
		 */

		ApplyFilterOnAOR: function (oSelectedSupervisor, oSelectedWorkcenter) {
			this.AssignedSupervisor = oSelectedSupervisor;
			this.AssignedWorkcenter = oSelectedWorkcenter;
			// check if AOR has been deleted, if yes then set the flag bAORDeleted to true
			if ((this.AssignedSupervisor && this.AssignedSupervisor !== null && this.AssignedSupervisor.length > 0) || (this.AssignedWorkcenter &&
					this.AssignedWorkcenter !== null && this.AssignedWorkcenter.length > 0)) {
				this.bAORDeleted = false;

			} else {
				this.bAORDeleted = true;

			}
			this.bAORFilterFlag = true;
			this._osmartTable.rebindTable();
			// call updateTileCountURL to update all the custom tiles
			TileManagement.updateTileCountURL(this);

		},

		/**
		 * OnAfterRendering of Worklist
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 */
		onAfterRendering: function () {
			var that = this;
			this.getModel("HoldModel").metadataLoaded().then(function () {
				//Set visibility of order specific hold button
				that.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable",
					ReuseUtil.checkOrdSpcfcChangeAvailable(that.getModel("HoldModel"))
				);
			});

			this.setCustomFiltersData();
			// getting semantic object and action from the pageId
			var sPageId = this.getView().getId();
			var sPageIdArray = sPageId.split("-");
			this.oSemanticObj = "#" + sPageIdArray[1] + "-" + sPageIdArray[2];
			// if onAfterRendering method is executed before personaization service gets the AOR data then call loadAORData method from onInit method else call loadAORData from OnAfterRendering
			if (!this.bOnAfterRenderExecuted && this.bPersServiceExecuted) {
				this.loadAORData();
			}
			this.bOnAfterRenderExecuted = true;
		},

		/**
		 * loadAORData -
		 * pass AOR information to loadSFCSettingsMenuOption method to load existing AOR and SFC menu button in launchpad.
		 * @public
		 */
		loadAORData: function () {
			var that = this;
			// call method loadSFCSettingsMenuOption from reuse library project to load the menu option
			if ((that.AssignedWorkcenter && that.AssignedWorkcenter !== null && that.AssignedWorkcenter.length >
					0) || (that.AssignedSupervisor &&
					that.AssignedSupervisor !== null && that.AssignedSupervisor.length > 0)) {
				// pass true if AOR is already assigned
				AORReuse.loadSFCSettingsMenuOption(that, "i2d.mpe.Supervisor", true);

				this.bAORDeleted = false;
				this.bAORFilterFlag = true;
			} else {
				this.bAORDeleted = true;
				// pass false if AOR is not assigned
				AORReuse.loadSFCSettingsMenuOption(that, "i2d.mpe.Supervisor", false);
			}
		},

		/** 
		 * Application state handler, which updates and saves the application state in lrep.
		 * @param oEvent - The channel of the event to subscribe to. 
		 * @param oAppstate - The identifier of the event to listen for
		 * @param oCustomFilterData - Contains the oData which is saved in the Appstate model.
		 */

		handleAppStateChanges: function (oEvent, oAppstate, oCustomFilterData) {
			var oSmartFilterBar = this.getView().byId("idSmartFilterBar");
			if (oCustomFilterData.bDirtyFlag) {
				this._oVariantMgt.currentVariantSetModified(true);
			}
			if (oCustomFilterData.VariantState && oCustomFilterData.VariantState !== "") {
				oSmartFilterBar.setCurrentVariantId(oCustomFilterData.variantId);
				oSmartFilterBar.applyVariant(oCustomFilterData.VariantState);
			}
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			if (oCustomFilterData.issuesFilter) {
				oSmartFilterBar.getControlByKey("CustomIssue").setSelectedKeys(oCustomFilterData.issuesFilter);
				ioAppStateModel.getProperty("/appState").issuesFilter = oCustomFilterData.issuesFilter;
			}
			//This code is commented temporarily to solve issue with smart filter bar
			if (oCustomFilterData.delayFilter || oCustomFilterData.delayFilter === "") {
				oSmartFilterBar.getControlByKey("CustomDelay").setSelectedKey(oCustomFilterData.delayFilter);
				ioAppStateModel.getProperty("/appState").delayFilter = oCustomFilterData.delayFilter;
			}
			if (oCustomFilterData.statusFilter) {
				oSmartFilterBar.getControlByKey("CustomStatus").setSelectedKeys(oCustomFilterData.statusFilter);
				ioAppStateModel.getProperty("/appState").statusFilter = oCustomFilterData.statusFilter;
			}
			if (oCustomFilterData.confirmationFilter) {
				oSmartFilterBar.getControlByKey("CustomConfirmation").setSelectedKey(oCustomFilterData.confirmationFilter);
				ioAppStateModel.getProperty("/appState").confirmationFilter = oCustomFilterData.confirmationFilter;
			}
			if (this._osmartTable.getTable().getShowOverlay()) {
				this._osmartTable.rebindTable();
			}
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},

		/**
		 * Event handler when category multi combo selection finishd
		 * @param {sap.ui.base.Event} oEvent the multicombo selectionChange event
		 */
		onCategorySelectionFinish: function (oEvent) {
			var oControl = this.getView().byId("idSmartFilterBar");
			oControl.fireFilterChange(oEvent);
		},

		/** 
		 * 
		 * handleRouteMatched method gets the app state key from URL
		 * @public
		 */
		handleRouteMatched: function (oEvent) {
			this.sAppState = oEvent.getParameter("arguments").iAppState;
			var sConfigName = oEvent.getParameter("config").name;
			this.getOwnerComponent().extractInnerAppStateFromURL(this.sAppState, sConfigName);
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			var aProperties = ioAppStateModel.getProperty("/appState");
			aProperties.selectedOrderData = undefined;
			ioAppStateModel.setProperty("/appState", aProperties);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
			var oOperationDetailModel = this.getView().getModel("DetailModel");
			var oOperationDetailData = oOperationDetailModel.getData();
			oOperationDetailData.selectedOrderData = undefined;
			oOperationDetailModel.setData(oOperationDetailData);
			this.getModel().setUseBatch(true);
			if (oOperationDetailData.bReleasedSuccess) {
				oOperationDetailData.bReleasedSuccess = false;
				oOperationDetailModel.setData(oOperationDetailData);
				this._osmartTable.rebindTable();
			}
		},

		/** 
		 * getI18NText method gets the i18n text from i18n folder based on the key
		 * @public
		 * @param {string} key of i18n text maintained in properties file.
		 * @param {array} pass parameters for that key
		 */

		getI18NText: function (isKey, aValues) {
			return this.getResourceBundle().getText(isKey, aValues);
		},

		/** 
		 * setCustomFiltersData method sets the data in all the custom filters
		 * @public
		 */
		setCustomFiltersData: function () {
			this.oCustomFilter = {};
			// adding dropdown values to issue type filter
			this.oCustomFilter.issues = [{
					id: "All",
					name: this.getI18NText("AllIssues")
				}, {
					id: "Delay",
					name: this.getI18NText("Delay")
				}, {
					id: "ComponentIssue",
					name: this.getI18NText("ComponentIssue")
				}
				/*, {
								id: "ToolIssue",
								name: this.getI18NText("ToolIssue")
							}*/
				, {
					id: "QuantityIssue",
					name: this.getI18NText("QuantityIssue")
				}, {
					id: "QualityIssue",
					name: this.getI18NText("QualityIssue")
				}, {
					id: "ProductionHold",
					name: this.getI18NText("ProductionHold")
				}
			];
			// adding dropdown values to the delay filter
			this.oCustomFilter.delay = [{
				key: "",
				value: this.getI18NText("equalorgreater_0hr")
			}, {
				key: "1.0",
				value: this.getI18NText("greater_1hr")
			}, {
				key: "2.0",
				value: this.getI18NText("greater_2hr")
			}, {
				key: "5.0",
				value: this.getI18NText("greater_5hr")
			}, {
				key: "12.0",
				value: this.getI18NText("greater_12hr")
			}, {
				key: "24.0",
				value: this.getI18NText("greater_1day")
			}, {
				key: "48.0",
				value: this.getI18NText("greater_2day")
			}];
			// adding dropdown values to status filter
			this.oCustomFilter.status = [{
				id: "All",
				name: this.getI18NText("AllStatus")
			}, {
				id: "01",
				name: this.getI18NText("status_created")
			}, {
				id: "02",
				name: this.getI18NText("status_scheduled")
			}, {
				id: "03",
				name: this.getI18NText("status_released")
			}, {
				id: "04",
				name: this.getI18NText("status_partConfirmed")
			}, {
				id: "05",
				name: this.getI18NText("status_confirmed")
			}, {
				id: "06",
				name: this.getI18NText("status_partdelivered")
			}, {
				id: "07",
				name: this.getI18NText("status_delivered")
			}, {
				id: "08",
				name: this.getI18NText("status_techCompleted")
			}, {
				id: "09",
				name: this.getI18NText("status_closed")
			}, {
				id: "10",
				name: this.getI18NText("status_deleted")
			}];

			this.oCustomFilter.RelOperations = [{
				key: "1",
				value: this.getI18NText("Yes")
			}, {
				key: "2",
				value: this.getI18NText("No")
			}];

			// creating JSON model and assigning it to view
			var loCustomFilterModel = new JSONModel(this.oCustomFilter);
			this.getView().setModel(loCustomFilterModel, "customFiltersModel");
		},

		/** 
		 * setCustomFiltersData method sets the data in all the custom filters
		 * @public
		 */
		setFiltersData: function (sHoldVisible) {
			this.oCustomFilter = {};
			// adding dropdown values to issue type filter
			if (sHoldVisible === true || sHoldVisible === "X") {
				// adding dropdown values to issue type filter
				this.oCustomFilter.issues = [{
						id: "All",
						name: this.getI18NText("AllIssues")
					}, {
						id: "Delay",
						name: this.getI18NText("Delay")
					}, {
						id: "ComponentIssue",
						name: this.getI18NText("ComponentIssue")
					}
					/*, {
									id: "ToolIssue",
									name: this.getI18NText("ToolIssue")
								}*/
					, {
						id: "QuantityIssue",
						name: this.getI18NText("QuantityIssue")
					}, {
						id: "QualityIssue",
						name: this.getI18NText("QualityIssue")
					}, {
						id: "ProductionHold",
						name: this.getI18NText("ProductionHold")
					}
				];
			} else {
				// adding dropdown values to issue type filter
				this.oCustomFilter.issues = [{
						id: "All",
						name: this.getI18NText("AllIssues")
					}, {
						id: "Delay",
						name: this.getI18NText("Delay")
					}, {
						id: "ComponentIssue",
						name: this.getI18NText("ComponentIssue")
					}
					/*, {
									id: "ToolIssue",
									name: this.getI18NText("ToolIssue")
								}*/
					, {
						id: "QuantityIssue",
						name: this.getI18NText("QuantityIssue")
					}, {
						id: "QualityIssue",
						name: this.getI18NText("QualityIssue")
					}
				];
			}

			// adding dropdown values to delay filter
			this.oCustomFilter.delay = [{
				key: "",
				value: this.getI18NText("equalorgreater_0hr")
			}, {
				key: "1.0",
				value: this.getI18NText("greater_1hr")
			}, {
				key: "2.0",
				value: this.getI18NText("greater_2hr")
			}, {
				key: "5.0",
				value: this.getI18NText("greater_5hr")
			}, {
				key: "12.0",
				value: this.getI18NText("greater_12hr")
			}, {
				key: "24.0",
				value: this.getI18NText("greater_1day")
			}, {
				key: "48.0",
				value: this.getI18NText("greater_2day")
			}];
			// adding dropdown values to status filter
			this.oCustomFilter.status = [{
				id: "All",
				name: this.getI18NText("AllStatus")
			}, {
				id: "01",
				name: this.getI18NText("status_created")
			}, {
				id: "02",
				name: this.getI18NText("status_scheduled")
			}, {
				id: "03",
				name: this.getI18NText("status_released")
			}, {
				id: "04",
				name: this.getI18NText("status_partConfirmed")
			}, {
				id: "05",
				name: this.getI18NText("status_confirmed")
			}, {
				id: "06",
				name: this.getI18NText("status_partdelivered")
			}, {
				id: "07",
				name: this.getI18NText("status_delivered")
			}, {
				id: "08",
				name: this.getI18NText("status_techCompleted")
			}, {
				id: "09",
				name: this.getI18NText("status_closed")
			}, {
				id: "10",
				name: this.getI18NText("status_deleted")
			}];

			this.oCustomFilter.RelOperations = [{
				key: "1",
				value: this.getI18NText("Yes")
			}, {
				key: "2",
				value: this.getI18NText("No")
			}];

			// creating JSON model and assigning it to view
			var loCustomFilterModel = new JSONModel(this.oCustomFilter);
			this.getView().setModel(loCustomFilterModel, "customFiltersModel");
		},

		//method called when data is received by table	
		/*
		 *To hide HOLD button and HOLD functionlaity
		 * @param {string} MfgFeatureIsActiveInAnyPlant
		 * @return TRUE if MfgFeatureIsActiveInAnyPlant = "X", else FALSE
		 */
		onDataReceived: function (oEvent) {

			if (oEvent.getParameters().getParameters().data && oEvent.getParameters().getParameters().data.results && oEvent.getParameters().getParameters()
				.data.results[0]) {
				var aComponents = oEvent.getParameters().getParameters().data.results;
				var sHoldVisible = aComponents[0].MfgFeatureIsActiveInAnyPlant;

				// if (sHoldVisible === "X") {
				// 	this._oHoldButton.setVisible(true);
				// } else {
				// 	this._oHoldButton.setVisible(false);
				// }
				this.setFiltersData(sHoldVisible);
			}
		},

		/** 
		 * handleBeforeRebindTable method applies the custom filter, pre sorter , pre filters and AOR on smart table
		 * @public
		 */
		handleBeforeRebindTable: function (oEvent) {
			this.sAORFilterString = "";
			var mBindingParams = oEvent.getParameter("bindingParams");
			mBindingParams.preventTableBind = false;
			this.ChangeSTableNoDataText();
			if (!this.bAORFilterFlag) {
				mBindingParams.preventTableBind = true;
				return;
			}

			var aTableFilter = mBindingParams.filters;
			var aTableSorter = mBindingParams.sorter;

			var aStatusSorter = new sap.ui.model.Sorter("OperationStatusInternalID", true);
			aTableSorter.push(aStatusSorter);
			var aStartDateSorter = new sap.ui.model.Sorter("OperationStartDate", true);
			aTableSorter.push(aStartDateSorter);
			var aStartTimeSorter = new sap.ui.model.Sorter("OpLtstSchedldExecStrtTme", true);
			aTableSorter.push(aStartTimeSorter);

			// applying filter based on the aor
			var oFilterAOR = AORReuse.updateAORFilters(this);
			// applying filter based on the selected issue custom filter
			var oFilterIssue = this.updateIssueCustomFilter();
			// applying filter based on the selected delay custom filter
			//This code is commented temporarily to solve issue with smart filter bar
			var oFilterDelay = this.updateDelayFilter();

			// applying filter based on the selected status custom filter
			var oSelectedFilterStatus = this.updateStatusFilter();

			var oSelectedFilterRelOperations = this.updateRelOperationsFilter();

			// integrating all the filters and assigning it to smart table filter object
			var oFilterCombination = new sap.ui.model.Filter([], true);

			//This code is commented temporarily to solve issue with smart filter bar
			if (oFilterDelay.aFilters.length > 0) {
				oFilterCombination.aFilters.push(oFilterDelay);
			}
			if (oFilterIssue.aFilters.length > 0) {
				oFilterCombination.aFilters.push(oFilterIssue);
			}

			if (oSelectedFilterStatus.aFilters.length > 0) {
				oFilterCombination.aFilters.push(oSelectedFilterStatus);
			}

			if (oSelectedFilterRelOperations.aFilters.length > 0) {
				oFilterCombination.aFilters.push(oSelectedFilterRelOperations);
			}

			var loODataModel;
			if (this.getOwnerComponent().getModel()) {
				loODataModel = this.getOwnerComponent().getModel();
			} else {
				loODataModel = this.getView().getModel();
			}
			// below code converts AOR filter object to string by calling createFilterParams method. This string we are using in saveAsTile file to  
			// replace AOR filters information in the count URL of all the custom tiles when AOR changes.
			if (oFilterAOR.aFilters.length > 0 && loODataModel && loODataModel.getServiceMetadata()) {
				var vMetadata = loODataModel.oMetadata;
				var oEntityTypeArray = loODataModel.getServiceMetadata().dataServices.schema[0].entityType;
				var oEntityType = "";
				for (var iCount = 0; iCount < oEntityTypeArray.length; iCount++) {
					if (loODataModel.getServiceMetadata().dataServices.schema[0].entityType[iCount].name === "C_ManageoperationsType") {
						oEntityType = loODataModel.getServiceMetadata().dataServices.schema[0].entityType[iCount];
					}
				}
				this.sAORFilterString = sap.ui.model.odata.ODataUtils.createFilterParams(oFilterAOR.aFilters, vMetadata, oEntityType);
				// removing $filter= from the generated string because this AOR string we have to use in service URL of the custom tile. 
				this.sAORFilterString = this.sAORFilterString.replace("$filter=", "");
				oFilterCombination.aFilters.push(oFilterAOR);
			}

			if (aTableFilter[0] && aTableFilter[0].aFilters) {
				var oSmartTableMultiFilter = aTableFilter[0];

				// if an internal multi-filter exists then combine custom multi-filters and internal multi-filters with an AND
				aTableFilter[0] = new sap.ui.model.Filter([oSmartTableMultiFilter, oFilterCombination], true);

			} else if (oFilterCombination.aFilters.length > 0) {
				if (oFilterCombination.aFilters.length > 0) {
					aTableFilter.push(oFilterCombination);
				}
			}

		},

		/**
		 * Triggered when each row check box is clicked on
		 * @memberOf i2d.mpe.orders.manages2.controller.Worklist
		 * @public
		 */
		handleTableItemSelection: function (oEvent) {
			var aTableListItems = oEvent.getSource().getSelectedItems();
			var oProperty, bReleasedFlag;
			// NEEDED? bHoldFlag;
			for (var i = 0; i < aTableListItems.length; i++) {
				oProperty = aTableListItems[i].getBindingContext().getObject();
				if (oProperty.OperationIsCreated !== "X") {
					bReleasedFlag = true;
					break;
				} else {
					bReleasedFlag = false;
				}
			}

			//multiple holds
			// for (var i = 0; i < aTableListItems.length; i++) {
			// 	oItem = aTableListItems[i];
			// 	sPath = oItem.getBindingContext().sPath;
			// 	oProperty = oItem.getBindingContext().oModel.getProperty(sPath);
			// 	//	bHoldFlag = formatter.getHoldButtonStatus(oProperty);
			// 	if (oProperty.OperationIsCreated !== "X") {
			// 		bReleasedFlag = true;
			// 		break;
			// 	} else {
			// 		bReleasedFlag = false;
			// 	}
			// }
			//multiple holds
			if (aTableListItems.length > 0 && !bReleasedFlag) {
				this._oOperationOrderReleaseButton.setEnabled(true);
			} else {
				this._oOperationOrderReleaseButton.setEnabled(false);
			}
			if (aTableListItems.length === 1) {
				//Edit button only available for non-shop floor orders
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", (oProperty.OrderIsShopFloorOrder === ""));
				// this._oEditButton.setEnabled(true);

				// check license (EPO feature) and status of operation
				// this._oHoldButton.setEnabled(formatter.getHoldButtonStatus(oProperty));
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", formatter.getHoldButtonStatus(oProperty));
			} else {

				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", false);
				// this._oEditButton.setEnabled(false);
				// this._oHoldButton.setEnabled(false);
				// Hold button enabled / disabled dependent on status of selected operations
				// for (i = 0; i < aTableListItems.length; i++) {
				// 	oProperty = aTableListItems[i].getBindingContext().getObject();
				// 	if (formatter.getHoldButtonStatus(oProperty) === false) {
				// 		this._oHoldButton.setEnabled(false);
				// 		break;
				// 	} else {
				// 		this._oHoldButton.setEnabled(true);
				// 	}
				// }
			}

			var aOperationsForOrdSpcfcChange = [],
				sManufacturingOrder = "";
			//To check for order specific holds (order change)
			for (i = 0; i < aTableListItems.length; i++) {
				var oOperation = aTableListItems[i].getBindingContext().getObject();
				if (sManufacturingOrder === "") {
					sManufacturingOrder = oOperation.ManufacturingOrder;
				}
				//Check if operations of same order are selected. Otherwise buttons are disabled
				if (formatter.isOperationChangePossible(oOperation) && sManufacturingOrder === oOperation.ManufacturingOrder) {
					aOperationsForOrdSpcfcChange.push(oOperation);
				} else {
					aOperationsForOrdSpcfcChange = [];
					break;
				}
			}
			if (aOperationsForOrdSpcfcChange.length > 0) {
				ReuseUtil.checkOprHasOpenOrdSpcfcChange(this.getModel("OSR"), aOperationsForOrdSpcfcChange, function (oData) {
					if (oData.results.length === 0) {
						//No existing order change; Enable Order Change and disable navigation
						this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldVisible", false);
						this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldVisible", true);
					} else {
						//Order Change Exists
						this.getView().getModel("ActionButtonVisiblity").setProperty("/oOrderSpecificChangeDetails", oData.results[0]);

						//If routing is released then enable navigation and disable order change 
						if (oData.results[0].BillOfOperationsVersionStatus === "10") {
							this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldVisible", true);
							this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldVisible", false);
						} else {
							this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldVisible", false);
							this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldVisible", true);
						}
					}
				}.bind(this));
			} else {
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldVisible", false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldVisible", false);
			}
		},

		/**
		 * Triggered when Release button is clicked on
		 * @memberOf i2d.mpe.orders.manages2.controller.Worklist
		 * @public
		 */
		handleReleaseButton: function (oEvent) {
			var aTableListItems = this._osmartTable.getTable().getSelectedItems();
			aTableListItems = aTableListItems.sort(function (a, b) {
				var n = a.getBindingContext().sPath.substring(51, 61) - b.getBindingContext().sPath.substring(51, 61);
				if (n !== 0) {
					return n;
				}
				return a.getBindingContext().oModel.getProperty(a.getBindingContext().sPath).ManufacturingOrderOperation - b.getBindingContext()
					.oModel.getProperty(b.getBindingContext().sPath).ManufacturingOrderOperation;
			});
			var iExternalCount = 0,
				oSuccessMessage = {
					aError: [],
					aWarning: []
				};
			var oLocalModel = this.getView().getModel();
			var mParams = {
				"method": "POST",
				"urlParameters": {
					"OrderInternalBillOfOperations": "",
					"OrderIntBillOfOperationsItem": ""
				},
				"success": function (oData, response) {
					iExternalCount++;
					if (response.headers["sap-message"]) {
						var oResponse = JSON.parse(response.headers["sap-message"]);
						if (oResponse.severity === "error" || oResponse.severity === "warning") {
							if (oResponse.severity === "error") {
								oResponse.order = oData.ManufacturingOrder;
								oSuccessMessage.aError.push(oResponse);
							} else {
								oResponse.order = oData.ManufacturingOrder;
								oSuccessMessage.aWarning.push(oResponse);
							}
						}
						for (var i = 0; i < oResponse.details.length; i++) {
							if (oResponse.details[i].severity === "error" || oResponse.details[i].severity === "warning") {
								if (oResponse.details[i].severity === "error") {
									oResponse.details[i].order = oData.ManufacturingOrder;
									oSuccessMessage.aError.push(oResponse.details[i]);
								} else {
									oResponse.details[i].order = oData.ManufacturingOrder;
									oSuccessMessage.aWarning.push(oResponse.details[i]);
								}
							}
						}
					}
					if (iExternalCount === aTableListItems.length) {
						var sMessageText, sFinalText, bCompact, z;
						if (oSuccessMessage.aError.length > 0) {
							sMessageText = this.getI18NText("operationReleaseRequestErrorMSG", [oSuccessMessage.aError.length, aTableListItems.length]);
							sFinalText = oSuccessMessage.aError[0].message;
							for (z = 1; z < oSuccessMessage.aError.length; z++) {
								sFinalText = sFinalText + "\n" + oSuccessMessage.aError[z].message;
							}
							if (oSuccessMessage.aWarning.length > 0) {
								for (z = 0; z < oSuccessMessage.aWarning.length; z++) {
									sFinalText = sFinalText + "\n" + oSuccessMessage.aWarning[z].message;
								}
								sMessageText = this.getI18NText("operationReleaseErrorAndWarningMSG", [oSuccessMessage.aError.length, oSuccessMessage.aWarning
									.length
								]);
							}
							bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
							this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, this.getI18NText("ErrorPopupTitle"), [MessageBox.Action.CLOSE],
								"operationReleaseOrderMSG", sFinalText, bCompact);
						} else if (oSuccessMessage.aWarning.length > 0) {
							sMessageText = this.getI18NText("operationReleaseWarningMSG", [oSuccessMessage.aWarning.length, aTableListItems.length]);
							sFinalText = oSuccessMessage.aWarning[0].message;
							for (z = 1; z < oSuccessMessage.aWarning.length; z++) {
								sFinalText = sFinalText + "\n" + oSuccessMessage.aWarning[z].message;
							}
							bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
							this.getDynamicMessageBox(sMessageText, MessageBox.Icon.WARNING, this.getI18NText("WarningPopupTitle"), [MessageBox.Action.CLOSE],
								"operationReleaseOrderMSG", sFinalText, bCompact);
							for (i = 0; i < aTableListItems.length; i++) {
								aTableListItems[i].setSelected(false);
							}
							this._oOperationOrderReleaseButton.setEnabled(false);
						} else {
							sMessageText = this.getI18NText("operationOrderReleasedSuccessMSG", [iExternalCount, aTableListItems.length]);
							MessageToast.show(sMessageText, {
								duration: 5000
							});
							for (i = 0; i < aTableListItems.length; i++) {
								aTableListItems[i].setSelected(false);
							}
							this._oOperationOrderReleaseButton.setEnabled(false);
						}
					}
				}.bind(this),
				"error": function (oError) {
					MessageToast.show("Release failed");
					this._oOperationOrderReleaseButton.setEnabled(false);
				}.bind(this)
			};
			var oItem, sPath;
			for (var q = 0; q < aTableListItems.length; q++) {
				oItem = aTableListItems[q];
				sPath = oItem.getBindingContext().sPath;
				mParams.urlParameters.OrderInternalBillOfOperations = sPath.substring(51, 61);
				mParams.urlParameters.OrderIntBillOfOperationsItem = sPath.substring(93, 101);
				oLocalModel.callFunction("/C_ManageoperationsReleaseoperation", mParams);
			}
		},

		handleHoldButton: function (oEvent) {

			var aItems = this._osmartTable.getTable().getSelectedItems();
			var sPath = aItems[0].getBindingContext().sPath;
			var sOrder = aItems[0].getBindingContext().oModel.getProperty(sPath).ManufacturingOrder;
			var sMaterial = aItems[0].getBindingContext().oModel.getProperty(sPath).Material;
			var sPlant = aItems[0].getBindingContext().oModel.getProperty(sPath).ProductionPlant;
			var sWorkCenter = aItems[0].getBindingContext().oModel.getProperty(sPath).WorkCenter;
			var sOrderOperationInternalID = aItems[0].getBindingContext().oModel.getProperty(sPath).OrderOperationInternalID;
			var sOrderInternalBillOfOperations = sPath.substring(51, 61);
			var sOrderIntBilOfOperationsItem = sPath.substring(93, 101);

			//handle multiple operations.
			var aHoldObjectArray = [];
			for (var iCount = 0; iCount < aItems.length; iCount++) {
				var sPath = aItems[iCount].getBindingContext().sPath;
				var sOrder = aItems[iCount].getBindingContext().oModel.getProperty(sPath).ManufacturingOrder;
				var sMaterial = aItems[iCount].getBindingContext().oModel.getProperty(sPath).Material;
				var sPlant = aItems[iCount].getBindingContext().oModel.getProperty(sPath).ProductionPlant;
				var sWorkCenter = aItems[iCount].getBindingContext().oModel.getProperty(sPath).WorkCenter;
				var sOrderOperationInternalID = aItems[iCount].getBindingContext().oModel.getProperty(sPath).OrderOperationInternalID;
				var sOrderInternalBillOfOperations = sPath.substring(51, 61);
				var sOrderIntBilOfOperationsItem = sPath.substring(93, 101);
				var oHoldObject = {
					ManufacturingOrder: sOrder,
					ProductionPlant: sPlant,
					Material: sMaterial,
					OrderOperationInternalID: sOrderIntBilOfOperationsItem,
					WorkCenter: sWorkCenter,
					OrderInternalID: sOrderInternalBillOfOperations
						//ShopFloorItem: 
						//Workcenter: 
				};
				aHoldObjectArray.push(oHoldObject);
			}

			var aHoldTypesRequired = [ReuseProjectConstants.HOLD.TYPE_ORDER, ReuseProjectConstants.HOLD.TYPE_MATERIAL, ReuseProjectConstants.HOLD
				.TYPE_WORKCENTER, ReuseProjectConstants.HOLD.TYPE_OPERATION
			];
			ApplyHoldDialog.initAndOpen(oHoldObject, this.getModel("HoldModel"), aHoldTypesRequired, aHoldObjectArray, ReuseProjectConstants.HOLD
				.TYPE_OPERATION, true);

			// Set parameters for event bus
			var oEventBusParams = this.getEventBusParameters();
			var oEventBus = sap.ui.getCore().getEventBus();
			ApplyHoldDialog.setEventBusParameters(oEventBus, oEventBusParams.ApplyHoldDialog.Channel,
				oEventBusParams.ApplyHoldDialog.Event);

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

		onHoldSuccessfullyComplete: function (sChannelId, sEventId, oResponse) {
			var sMessageText, sFinalText;
			var aTableItems = this._osmartTable.getTable().getSelectedItems();
			if (oResponse.success) {
				this._osmartTable.rebindTable();
				if (oResponse.info) {
					sMessageText = oResponse.info;
					MessageToast.show(sMessageText);
					for (var i = 0; i < aTableItems.length; i++) {
						aTableItems[i].setSelected(false);
					}
				}
				this._oOperationOrderReleaseButton.setEnabled(false);
				// this._oHoldButton.setEnabled(false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", false);
				// this._oEditButton.setEnabled(false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
			} else {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				if (oResponse.detail || oResponse.info) {
					sMessageText = oResponse.info;
					sFinalText = oResponse.detail;
					this.getDynamicMessageBox(sMessageText, MessageBox.Icon.ERROR, "Error", [MessageBox.Action.CLOSE], "ErrorOrderMSG", sFinalText,
						bCompact);
				}
				this._oOperationOrderReleaseButton.setEnabled(false);
				// this._oHoldButton.setEnabled(true);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", true);
				// this._oEditButton.setEnabled(false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
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

		/**
		 * Used to calculate the Status custom filters. 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @return {object}  : The selected status Filters
		 */
		updateStatusFilter: function () {
			// applying filter based on the selected status custom filter
			var oFilterStatus = new sap.ui.model.Filter([], false);
			var oSelectedStatus = [];
			if (this._oSmartFilter.getControlByKey("CustomStatus")) {
				oSelectedStatus = this._oSmartFilter.getControlByKey("CustomStatus").getSelectedKeys();
			} else {
				oSelectedStatus = this.getView().byId("idCustomStatusMultiSelectBox").getSelectedKeys();
			}
			for (var i = 0; oSelectedStatus.length > i; i++) {

				if (oSelectedStatus[i]) {
					if (oSelectedStatus[i] !== "All") {
						oFilterStatus.aFilters.push(new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, oSelectedStatus[
							i]));
					}
				}
			}
			return oFilterStatus;
		},
		/**
		 * Used to get the right fileter parameter to filter. 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @param {string}	: Status code
		 * @return {string}  : The selected status filter value
		 */
		_getStatusFieldValue: function (sStatusCode) {
			var sSearchField = "";
			switch (sStatusCode) {
			case "01":
				sSearchField = "OperationIsCreated";
				break;
			case "02":
				sSearchField = "OperationIsScheduled";
				break;
			case "03":
				sSearchField = "OperationIsReleased";
				break;
			case "04":
				sSearchField = "OperationIsPartiallyConfirmed";
				break;
			case "05":
				sSearchField = "OperationIsConfirmed";
				break;
			case "06":
				sSearchField = "OperationIsPartiallyDelivered";
				break;
			case "07":
				sSearchField = "OperationIsDelivered";
				break;
			case "08":
				sSearchField = "OperationIsTechlyCompleted";
				break;
			case "09":
				sSearchField = "OperationIsClosed";
				break;
			case "10":
				sSearchField = "OperationIsDeleted";
				break;
			}
			return sSearchField;
		},
		/**
		 * Used to calculate the Issue Filter array. 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @return {object}  : The selected Issues Filters
		 */
		updateIssueCustomFilter: function () {
			var oFilterIssue = new sap.ui.model.Filter([], false);
			var oSelectedIssues = [];
			if (this._oSmartFilter.getControlByKey("CustomIssue")) {
				oSelectedIssues = this._oSmartFilter.getControlByKey("CustomIssue").getSelectedKeys();
			}
			for (var i = 0; oSelectedIssues.length > i; i++) {
				if (oSelectedIssues[i]) {
					if (oSelectedIssues[i] === "Delay" || oSelectedIssues[i] === "All") {
						oFilterIssue.aFilters.push(new sap.ui.model.Filter("OperationExecutionStartIsLate", sap.ui.model.FilterOperator.EQ, true));
						oFilterIssue.aFilters.push(new sap.ui.model.Filter("OperationExecutionEndIsLate", sap.ui.model.FilterOperator.EQ, true));
					} else if (oSelectedIssues[i] === "QuantityIssue" || oSelectedIssues[i] === "All") {
						oFilterIssue.aFilters.push(new sap.ui.model.Filter("OperationYieldDeviationQty", sap.ui.model.FilterOperator.LT, 0));
					} else if (oSelectedIssues[i] === "ComponentIssue" || oSelectedIssues[i] === "All") {
						oFilterIssue.aFilters.push(new sap.ui.model.Filter("OperationHasMissingComponents", sap.ui.model.FilterOperator.Contains, "X"));
					} else if (oSelectedIssues[i] === "QualityIssue" || oSelectedIssues[i] === "All") {
						oFilterIssue.aFilters.push(new Filter("OperationHasScrapQualityIssue", sap.ui.model.FilterOperator.Contains, "X"));
						oFilterIssue.aFilters.push(new Filter("InspHasRejectedCharc", sap.ui.model.FilterOperator.Contains, "X"));
						oFilterIssue.aFilters.push(new Filter("InspHasRejectedInspSubset", sap.ui.model.FilterOperator.Contains, "X"));
						oFilterIssue.aFilters.push(new Filter("InspHasRejectedInspLot", sap.ui.model.FilterOperator.Contains, "X"));
					} else if (oSelectedIssues[i] === "ProductionHold" || oSelectedIssues[i] === "All") {
						oFilterIssue.aFilters.push(new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, true));
					}
				}
			}
			return oFilterIssue;
		},

		/**
		 * Used to calculate the Delay Filter array. 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @return {object}  : The selected Delay Filters
		 *
		 * This code is commented temporarily to solve issue with smart filter bar
		 */
		updateDelayFilter: function () {
			var oSelectedDelay = [];
			if (this._oSmartFilter.getControlByKey("CustomDelay")) {
				oSelectedDelay = this._oSmartFilter.getControlByKey("CustomDelay").getSelectedKey();
			}
			var oFilterDelay = new sap.ui.model.Filter([], false);
			if (oSelectedDelay && oSelectedDelay.length > 0) {
				oFilterDelay.aFilters.push(new sap.ui.model.Filter("ExecutionEndLatenessInHours", sap.ui.model.FilterOperator.GT, oSelectedDelay));
				oFilterDelay.aFilters.push(new sap.ui.model.Filter("ExecutionStartLatenessInHours", sap.ui.model.FilterOperator.GT, oSelectedDelay));
			}
			return oFilterDelay;
		},

		/**
		 * Used to calculate the Operations relevant for confirmation Filter array. 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @return {object}  : The selected  Operations relevant for confirmation Filters
		 */
		updateRelOperationsFilter: function () {
			var oSelectedRelOperation = [];

			if (this._oSmartFilter.getControlByKey("CustomConfirmation")) {
				oSelectedRelOperation = this._oSmartFilter.getControlByKey("CustomConfirmation").getSelectedItems();
			}
			var oFilterRelOperations = new sap.ui.model.Filter([], false);
			for (var i = 0; oSelectedRelOperation.length > i; i++) {
				if (oSelectedRelOperation[i].getKey() === "1") {
					oFilterRelOperations.aFilters.push(new sap.ui.model.Filter("ConfirmationIsNotPossible", sap.ui.model.FilterOperator.NE, true));
				}
				if (oSelectedRelOperation[i].getKey() === "2") {
					oFilterRelOperations.aFilters.push(new sap.ui.model.Filter("ConfirmationIsNotPossible", sap.ui.model.FilterOperator.EQ, true));
				}
			}

			return oFilterRelOperations;
		},

		/**
		 * Triggered when the Variant is loaded in the SmartFilterBar. The list of Variants is set here
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 
		 */
		handleVariantFetch: function () {
			var oVariantMgt = this._oVariantMgt;
			var aVariants = oVariantMgt.getVariantItems();
			var sVariantName = null;
			var sVariantKey = null;
			var aVariantNames = [];
			// saving all the variant in the local JSON before execution of attach Manage event of smart variant management
			if (aVariants.length > 0) {
				for (var iCount = 0; iCount < aVariants.length; iCount++) {
					sVariantKey = aVariants[iCount].getKey();
					sVariantName = aVariants[iCount].getText();
					var oVariants = {
						vKey: sVariantKey,
						vName: sVariantName
					};
					aVariantNames.push(oVariants);
				}
			}
			this._aVariants = aVariantNames;
		},
		/**
		 * Triggered when the Variant is loaded in the SmartFilterBar. This method reads _CUSTOM data of the variant and sets to the respective custom filter
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 
		 */
		handleVariantLoad: function () {
			// reading _CUSTOM JSON of filter bar and assigning the values to custom filters on variant load
			var oCustomFilterData = this._oSmartFilter.getFilterData();
			this.oFilterData = this._oSmartFilter.getFilterData();
			if (oCustomFilterData._CUSTOM) {
				var oCustomFieldData = oCustomFilterData._CUSTOM;
				if (oCustomFieldData.Issues) {

					this._oSmartFilter.getControlByKey("CustomIssue").setSelectedKeys(oCustomFieldData.Issues);
				} else {
					this._oSmartFilter.getControlByKey("CustomIssue").setSelectedKeys([]);
				}
				//This code is commented temporarily to solve issue with smart filter bar
				if (oCustomFieldData.Delay) {
					this._oSmartFilter.getControlByKey("CustomDelay").setSelectedKey(oCustomFieldData.Delay);
				} else {
					this._oSmartFilter.getControlByKey("CustomDelay").setSelectedKey("");
				}

				if (oCustomFieldData.Status) {

					this._oSmartFilter.getControlByKey("CustomStatus").setSelectedKeys(oCustomFieldData.Status);
				} else {
					this._oSmartFilter.getControlByKey("CustomStatus").setSelectedKeys([]);
				}

				if (oCustomFieldData.Confirmation) {
					this._oSmartFilter.getControlByKey("CustomConfirmation").setSelectedKeys(oCustomFieldData.Confirmation);
				} else {
					this._oSmartFilter.getControlByKey("CustomConfirmation").setSelectedKeys([]);
				}
			}
			if (this._oVariantMgt.getCurrentVariantId() === "") {
				this.bAssignDefaultStatusFilter = true;
			}

		},
		/**
		 * Triggered when any item is pressed of smart table . This method reads the current operation id and calls navTo method to navigate to detail page.
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 
		 */
		handleOperationSelect: function (oEvent) {
			var sOperation = oEvent.getParameter("listItem").getBindingContextPath();
			var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
			var sOperationId = sOperation.substr(1);
			this.updateOperationDetailModel(sOperationId, oSelectedItem);
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			var aProperties = ioAppStateModel.getProperty("/appState");
			aProperties.selectedOrderData = oSelectedItem;
			ioAppStateModel.setProperty("/appState", aProperties);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
			this.getRouter().navTo("object", {
				operationId: sOperation.substr(1),
				iAppState: this.sAppState
			}, false);
			// this.getRouter().getTargets().display("objectNotFound");
		},
		/**
		 * 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @param {string} id of the selected operation
		 */
		updateOperationDetailModel: function (sOperationId, oSelectedItem) {
			var oOperationDetailModel = this.getView().getModel("DetailModel");
			var oOperationDetailData = oOperationDetailModel.getData();
			oOperationDetailData.orderId = sOperationId;
			oOperationDetailData.WorkCenterInternalID = oSelectedItem.WorkCenterInternalID;
			oOperationDetailData.ProductionPlant = oSelectedItem.ProductionPlant;
			oOperationDetailData.selectedOrderData = oSelectedItem;
			oOperationDetailModel.setData(oOperationDetailData);
		},
		/**
		 * Triggered when any item is selected/deselected of Status custom filter
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 */
		handleStatusSelectionChange: function (oEvent) {
			// this._oHoldButton.setEnabled(false);
			this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", false);
			var sCustomName = "statusFilter";
			this.handleSelectAllOptionOfMultiSelectBox(oEvent, sCustomName);
			var onHandSelectedItems = oEvent.getSource().getSelectedItems();
			if (onHandSelectedItems.length > 0) {
				oEvent.getSource().data("hasValue", true);
			} else {
				oEvent.getSource().data("hasValue", false);
			}
		},

		/**
		 * Triggered when any item is selected/deselected of Issue custom filter
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 
		 */
		handleIssueSelectionChange: function (oEvent) {
			var sCustomName = "issuesFilter";
			this.handleSelectAllOptionOfMultiSelectBox(oEvent, sCustomName);
			/*	var onHandSelectedItems = oEvent.getSource().getSelectedItems();
				if (onHandSelectedItems.length > 0) {
					oEvent.getSource().data("hasValue", true);
				} else {
					oEvent.getSource().data("hasValue", false);
				}*/
		},
		/**
		 * handleSelectAllOptionOfMultiSelectBox method selects all the options of custom filter if "All" is selected
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 */
		handleSelectAllOptionOfMultiSelectBox: function (oEvent, sCustomName) {
			var oSource = oEvent.getSource();
			var sSelectedKey = oEvent.getParameter("changedItem").getProperty("key");
			var aSelectedKeys = oSource.getProperty("selectedKeys");
			if (sSelectedKey && (sSelectedKey === "All") && (oEvent.getParameter("selected"))) {
				//Select All
				oSource.setSelectedItems(oSource.getItems());
				aSelectedKeys = oSource.getSelectedKeys();
				this.updateAppStateforCustomFilters(aSelectedKeys, sCustomName);
			} else if (sSelectedKey && (sSelectedKey === "All") && (!oEvent.getParameter("selected"))) {
				// UnSelect All
				oSource.setSelectedItems([]);
				aSelectedKeys = [];
			} else {
				if (aSelectedKeys.indexOf("All") !== -1) {
					//If user select All and then deselect Any of the options apart from 'All', then Deselect 'All' option
					aSelectedKeys.splice(aSelectedKeys.indexOf("All"), 1);
					oSource.setSelectedKeys(aSelectedKeys);
				} else {
					var iNoOfItems = oSource.getItems().length;
					var iNoOfSelectedItems = aSelectedKeys.length;
					var iDelta = iNoOfItems - iNoOfSelectedItems;
					if (iDelta === 1) {
						//if User Selects All the Options apart from the 'All', then select all options
						oSource.setSelectedItems(oSource.getItems());
						aSelectedKeys = oSource.getSelectedKeys();
					}
				}
			}

			this.updateAppStateforCustomFilters(aSelectedKeys, sCustomName);

		},
		/**
		 * handleDelayFilter method gets the selected value of delay filter and stores in app state model
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 
		 */
		handleDelayFilter: function (oEvent) {
			var oItem = oEvent.getParameter("selectedItem");
			var oSelectedKey = oItem.getKey();
			var sCustomName = "delayFilter";
			this.updateAppStateforCustomFilters(oSelectedKey, sCustomName);

		},

		/** 
		 * Event handler of Operation Relevant for confirmation filter
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @param oEvent
		 */
		handleRelOperationChange: function (oEvent) {
			var sCustomName = "confirmationFilter";
			this.updateAppStateforCustomFilters(oEvent, sCustomName);
			/*	var onHandSelectedItems = oEvent.getSource().getSelectedItems();
				if (onHandSelectedItems.length > 0) {
					oEvent.getSource().data("hasValue", true);
				} else {
					oEvent.getSource().data("hasValue", false);
				}*/
		},

		/** 
		 * on change of any filter, this method updates the app state model
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @param oEvent
		 */
		handleFilterChange: function (oEvent) {
			this.handleAppstateUpdate(oEvent);
		},

		/* =========================================================== */
		/* App State Update  Methods                                   */
		/* =========================================================== */
		/**
		 * updateAppStateforCustomFilters method gets the selected value of selected filter and stores in app state model
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @param {string} 
		 * @param {sCustomName} name of custom filter key
		 */
		updateAppStateforCustomFilters: function (sKey, sCustomName) {
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			ioAppStateModel.getProperty("/appState")[sCustomName] = sKey;
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},

		/*
		 * Save the variants in the appstate model
		 * @params {object} loEvent
		 */
		handleAppstateUpdate: function (loEvent) {
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			var aProperties = ioAppStateModel.getProperty("/appState");
			aProperties.variantId = loEvent.getSource().getCurrentVariantId();
			aProperties.VariantState = loEvent.getSource().fetchVariant();
			aProperties.bDirtyFlag = this._oVariantMgt.currentVariantGetModified();
			ioAppStateModel.setProperty("/appState", aProperties);
			this.getOwnerComponent().updateAppStateFromAppStateModel();

		},

		/**
		 * Triggered before variant gets saved. This method saves all the custom filter data of that variant in _CUSTOM object.
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @param {object} oEvent action data performed at that event
		 * @param {boolean} bGOButtonClickFlag Flag provided for differentiating multiple table rebind calls
		 */
		handleBeforeVariantSave: function (oEvent, bGOButtonClickFlag) {
			var oCustomFilter = {
				_CUSTOM: {
					Issues: "",
					Delay: "",
					Status: "",
					Confirmation: ""
				}
			};
			if (this._oSmartFilter.getControlByKey("CustomIssue").getSelectedKeys()) {
				var aIssueArray = this._oSmartFilter.getControlByKey("CustomIssue").getSelectedKeys();
				oCustomFilter._CUSTOM.Issues = aIssueArray;
			}
			//--> This code is commented temporarily to solve issue with smart filter bar
			if (this._oSmartFilter.getControlByKey("CustomDelay").getSelectedKey()) {
				oCustomFilter._CUSTOM.Delay = this._oSmartFilter.getControlByKey("CustomDelay").getSelectedKey();
			}
			if (this._oSmartFilter.getControlByKey("CustomStatus").getSelectedKeys()) {
				var aStatusArray = this._oSmartFilter.getControlByKey("CustomStatus").getSelectedKeys();

				oCustomFilter._CUSTOM.Status = aStatusArray;
			}
			if (this._oSmartFilter.getControlByKey("CustomConfirmation").getSelectedKeys()) {
				var aConfirmationArray = this._oSmartFilter.getControlByKey("CustomConfirmation").getSelectedKeys();

				oCustomFilter._CUSTOM.Confirmation = aConfirmationArray;
			}
			var oFilterObject = this._oSmartFilter.getFilterData();
			oFilterObject._CUSTOM = oCustomFilter._CUSTOM;
			var bDirtyFlag = this._oVariantMgt.currentVariantGetModified();
			var vSearchFieldValue = this._oSmartFilter.getBasicSearchControl().getValue();
			this._oSmartFilter.setFilterData(oFilterObject, true);
			if (vSearchFieldValue !== "") {
				this._oSmartFilter.getBasicSearchControl().setValue(vSearchFieldValue);
			}
			this._oSmartFilter.fireFilterChange();
			if (bDirtyFlag !== this._oVariantMgt.currentVariantGetModified()) {
				this._oVariantMgt.currentVariantSetModified(bDirtyFlag);
				this._callHandleAppStateUpdate();
			}
			var aTableItems = this._osmartTable.getTable().getSelectedItems();
			for (var i = 0; i < aTableItems.length; i++) {
				aTableItems[i].setSelected(false);
			}
			this._oOperationOrderReleaseButton.setEnabled(false);
			// this._oEditButton.setEnabled(false);
			this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
			// logic to handle variant save without pressing Go button
			if (this._osmartTable.getTable().getShowOverlay()) {
				if (!bGOButtonClickFlag) {
					this._osmartTable.rebindTable();
				}
			}
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			var aProperties = ioAppStateModel.getProperty("/appState");
			aProperties.VariantTableState = JSON.stringify(this._osmartTable.fetchVariant());
			ioAppStateModel.setProperty("/appState", aProperties);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},

		/**
		 * Triggered when the Variant is saved in the smart variant management. If createTile option is selected while creating a variant, 
		 * then call updatePersonalizationContainer to save the information in personalization container
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @param {object} oEvent
		 */
		handleAfterVariantSave: function (oEvent) {
			if (this.bCreateTileSelected) {
				var sFilters = "";
				var oSmartTableInstance = this.getView().byId("idMonitorOperationsTable");
				if (oSmartTableInstance.getTable().getBindingInfo('items')) {
					sFilters = oSmartTableInstance.getTable().getBindingInfo('items').binding.sFilterParams;
				}
			}
			TileManagement.updatePersonalizationContainer(this, this.getView().byId("idMonitorOperationsTable").getEntitySet(), sFilters);
			this.bCreateTileSelected = false;
			//update App State for the save of the variant.
			this.handleAppstateUpdate(oEvent);
			if (this._osmartTable.getTable().getShowOverlay()) {
				this._osmartTable.getTable().setShowOverlay(false);
			}
		},

		/**
		 * triggers when Variant Management is initialised. On click of custom tiles, this method loads the variant based on variant id saved in the URL of custom tile.
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @public
		 * @param {object} oVariantMgmt : Variant Management
		 */
		loadInitialVariant: function () {
			var oVariantMgt = this._oVariantMgt;
			var sVariantText = this.sSelectedVariant;
			if (oVariantMgt && sVariantText !== "") {

				var sVariantKey;
				var aVariantItems = oVariantMgt.getVariantItems();
				for (var iCount = 0; iCount < aVariantItems.length; iCount++) {
					if (aVariantItems[iCount].getText().trim() === sVariantText.trim()) {
						sVariantKey = aVariantItems[iCount].getKey();
						break;
					}
				}
				if (sVariantKey) {
					oVariantMgt.setCurrentVariantId(sVariantKey);
				}
			}
			this._oSmartFilter.determineFilterItemByName("CustomStatus").setLabelTooltip(this.getI18NText("StatusFilter"));
			//this._oSmartFilter.determineFilterItemByName("CustomDelay").setLabelTooltip(this.getI18NText("DelayFilter"));
			this._oSmartFilter.determineFilterItemByName("CustomConfirmation").setLabelTooltip(this.getI18NText("ConfirmationFilter"));
		},

		/**
		 * trigers when variant is updated or created.
		 * This method calls the bookmark service to create or update a tile on launchpad.
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @param oEvent
		 * @public
		 */
		handleSaveVariant: function (oEvent) {
			TileManagement.saveVariantAsTile(oEvent, this, "idMonitorOperationsTable");
		},
		/**
		 * triggers when variant is renamed or deleted using manage variant.
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @param oEvent
		 * @public
		 */

		handleManageVariant: function (oEvent) {
			TileManagement.manageVariant(oEvent, this);
		},

		/**
		 * Select a variant
		 * @memberOf i2d.mpe.orders.manages2.controller.Worklist
		 * @public
		 * @param {object} oEvent Event information for selecting the variant
		 */
		handleSelectVariant: function (oEvent) {
			var oSmartTableInstance = this.getView().byId("idMonitorOrdersTable");
			var ioAppStateModel = this.getOwnerComponent().getModel("AppState");
			var aProperties = ioAppStateModel.getProperty("/appState");
			jQuery.sap.delayedCall(1000, this, function () {
				aProperties.VariantTableState = JSON.stringify(oSmartTableInstance.fetchVariant());
				ioAppStateModel.setProperty("/appState", aProperties);
				this._callHandleAppStateUpdate();
			});
		},

		/*Based on the color of the icon, it opens the popover
		 * @param oEvent 
		 * @memberOf i2d.mpe.operations.manages2.controller.Worklist
		 * @param oEvent
		 */

		handleIconPress: function (oEvent) {
			var oColor = oEvent.getSource().getColor();
			if (oColor === "#d9d9d9") {
				return "";
			} else {
				ReuseUtil.openIssuePopOver(oEvent, this);
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
		 * Handler for material link press, opens a popover which shows the details of the material
		 * @param oEvent
		 */
		handleOrderOperationPress: function (oEvent) {
			this.oProductionOrderOperationPop.openOperationsPopOver(oEvent, this);
		},
		/** 
		 * Handler for order link press, opens a popover which shows the details of the order
		 * @param oEvent
		 */
		handleOrderNumberPress: function (oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext().sPath;
			var oProperty = oSource.getModel().getProperty(sPath);
			var sManufacturingOrderId = oProperty.ManufacturingOrder || oProperty.MRPElement;
			this.oProductionOrderPop.openProdOrdPopOver(oEvent, this, sManufacturingOrderId);
		},
		/** 
		 * Handler for workcenter link press, opens a popover which shows the details of the workcenter
		 * @param oEvent
		 */
		handleWorkCenterPress: function (oEvent) {
			this.oWorkCenterPop.openWorkCenterPopOver(oEvent, this);
		},

		/** 
		 * Handler for status link press, opens a popover which shows the order status information
		 * @param oEvent
		 */
		handleStatusLinkPress: function (oEvent) {
			OrderOperationStatus.openStatusPopOver(oEvent, this);
		},

		/*
		 *To save the unsaved custom filters to _CUSTOM object
		 */
		handleGOBtnPress: function () {
			this.handleBeforeVariantSave(undefined, "true");
		},
		/** 
		 * Handler for changing the smarttable no data text
		 * @param 
		 */
		ChangeSTableNoDataText: function () {
			// For Changing the noDataText 
			if (this.bAORDeleted) {
				this._osmartTable.setNoData(this.getI18NText("AORDeleted"));
				this._osmartTable.getTable().setNoDataText(this.getI18NText("AORDeleted"));
			} else {
				this._osmartTable.setNoData(this.getI18NText("AORSelected"));
				this._osmartTable.getTable().setNoDataText(this.getI18NText("AORSelected"));
			}
		},

		/** 
		 * Custom Handler for creating a custom event object and calling handleAppStateUpdate method
		 * @param 
		 */
		_callHandleAppStateUpdate: function () {
			var oEvent = {
				oSourceTemp: this._oSmartFilter,
				getSource: function () {
					return this.oSourceTemp;
				}
			};
			this.handleAppstateUpdate(oEvent);
		},

		/** 
		 * Custom Handler executed when inspection lot hyperlink was pressed.
		 * @param 
		 */
		handleInspectionPress: function (oEvent) {
			var oCurrentInspection = oEvent.getSource().getBindingContext().getObject();
			var oParameters = {
				"InspectionLot": oCurrentInspection.InspectionLot

			};
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "InspectionLot",
					action: "display"
				},
				params: oParameters
			});
		},

		onPressOrdSpcfcChange: function (oControlEvent) {

			var that = this,
				aSelectedItems = [],
				aSelectedItemsTemp = this._osmartTable.getTable().getSelectedItems(),
				//Check if BOOVersionChangeRecordIsRqd is already available in app context. This is required to 
				//determine if Order Change can be created without a Change Record. This field can be added in requestAtLeast parameter 
				//of smart table but then it is always fetched leading to decreased performance
				sBOOVersionChangeRecordIsRqdAvailable = aSelectedItemsTemp[0].getBindingContext().getObject().hasOwnProperty(
					"BOOVersionChangeRecordIsRqd");
			var pBOOVersionChangeRecordIsRqdLoaded = new jQuery.Deferred();

			if (sBOOVersionChangeRecordIsRqdAvailable) {
				aSelectedItemsTemp.forEach(function (oSelectedItem) {
					aSelectedItems.push(oSelectedItem.getBindingContext().getObject());
				});
				pBOOVersionChangeRecordIsRqdLoaded.resolve();
			} else {
				//If routing profile customizing not availabel then get it from backend
				that.getView().getModel().read(aSelectedItemsTemp[0].getBindingContextPath(), {
					urlParameters: {
						$select: "BOOVersionChangeRecordIsRqd"
					},
					success: function (oData) {
						aSelectedItemsTemp.forEach(function (oSelectedItem) {
							var oSelectedItemObject = oSelectedItem.getBindingContext().getObject();
							oSelectedItemObject.BOOVersionChangeRecordIsRqd = oData.BOOVersionChangeRecordIsRqd;
							aSelectedItems.push(oSelectedItemObject);
						});
						pBOOVersionChangeRecordIsRqdLoaded.resolve();
					},
					error: function () {
						aSelectedItemsTemp.forEach(function (oSelectedItem) {
							aSelectedItems.push(oSelectedItem.getBindingContext().getObject());
						});
						pBOOVersionChangeRecordIsRqdLoaded.resolve();
					}
				});
			}

			//Once promise is resolved, open the popup
			pBOOVersionChangeRecordIsRqdLoaded.done(function () {
				if (that._hasSameOrderNumber(aSelectedItems, aSelectedItems[0].ManufacturingOrder)) {
					OrdSpcfcChange.initAndOpen({
						oHoldModel: that.getView().getModel("HoldModel"),
						oCRModel: that.getView().getModel("CR"),
						oOSRModel: that.getView().getModel("OSR"),
						oSelectedOrder: aSelectedItems, //this._osmartTable.getTable().getSelectedItems()[0].getBindingContext().getObject(),
						oOrderSpecificChangeDetails: that.getView().getModel("ActionButtonVisiblity").getProperty("/oOrderSpecificChangeDetails"),
						oCallBack: that.onOrdSpcfcChangeCallBack.bind(that),
						Ischangeforwholeorder: false
					});
				} else {
					sap.m.MessageBox.information(that.getI18NText("msgOnlyForSameOrder"));
				}
			});
		},

		/**
		 * @param {Array} aOrders - array of orders that will be compared with sManufacturingOrder
		 * @param {string} sManufacturingOrderNumber - Order number 
		 * 
		 * @returns Returns true if each order in aOrders has the order number passed in sManufacturingOrder. If one elemtes has a differen order number it will return false.
		 */
		_hasSameOrderNumber: function (aOrders, sManufacturingOrderNumber) {
			for (var i = 0; i < aOrders.length; i++) {
				if (aOrders[i].ManufacturingOrder !== sManufacturingOrderNumber) {
					return false;
				}
			}
			return true;
		},

		onOrdSpcfcChangeCallBack: function () {
			this._osmartTable.rebindTable();
		},

		onPressDisplayOrdScpfcChange: function () {
			NavHelper.navToShopFloorRoutingChange(this.getView().getModel("ActionButtonVisiblity").getProperty("/oOrderSpecificChangeDetails"));
		},

		/*
		 * To unsubscribe the eventbus
		 * on exit of applications
		 *[UPDATE] This function is commented out because it does not allow eventbus to save all the filters. Hence, when user navigates 
		 * back to worklist view from any other app, filters get cleared out
		 */

		onExit: function () {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("AppState", "handleAppstateChanges", this.handleAppStateChanges, this);
			AORReuse.oAppSettingsButton.destroy();
			AORReuse.oAppSettingsButton = null;
		},

		/**
		 * Handler for Edit order 
		 * This method will open SAP CO02 transaction in a new tab.
		 **/
		handleEditPress: function () {
			var aItems = this._osmartTable.getTable().getSelectedItems();
			var sPath = aItems[0].getBindingContext().sPath;
			var sOrder = aItems[0].getBindingContext().oModel.getProperty(sPath).ManufacturingOrder;
			ReuseUtil.editOrder(sOrder);
		},

		/**
		 * Handler for Exporting Excel
		 * This method manually add new columns to the excel that is going to be exported
		 **/
		handleBeforeExport: function (oEvent) {
			var oExportSettings = oEvent.getParameter("exportSettings");
			var oNewColumn = this.getExcelWorkBookParameters("testingScheduledStartDateFiled", this.getI18NText("OpLtstSchedldExecStrtDte"),
				"OpLtstSchedldExecStrtDte", "date");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingScheduledStartTimeFiled", this.getI18NText("OpLtstSchedldExecStrtTme"),
				"OpLtstSchedldExecStrtTme", "time");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingActualStartDateFiled", this.getI18NText("OpActualExecutionStartDate"),
				"OpActualExecutionStartDate", "date");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingActualStartTimeFiled", this.getI18NText("OpActualExecutionStartTime"),
				"OpActualExecutionStartTime", "time");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingScheduledEndDateFiled", this.getI18NText("OpLtstSchedldExecEndDte"),
				"OpLtstSchedldExecEndDte", "date");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingScheduledEndTimeFiled", this.getI18NText("OpLtstSchedldExecEndTme"),
				"OpLtstSchedldExecEndTme", "time");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingConfirmedEndDateFiled", this.getI18NText("OpActualExecutionEndDate"),
				"OpActualExecutionEndDate", "date");
			oExportSettings.workbook.columns.push(oNewColumn);
			oNewColumn = this.getExcelWorkBookParameters("testingConfirmedEndTimeFiled", this.getI18NText("OpActualExecutionEndTime"),
				"OpActualExecutionEndTime", "time");
			oExportSettings.workbook.columns.push(oNewColumn);
		},

		/**
		 * Getter for adding a new column
		 * This gets a new column by passing the required parameters
		 **/
		getExcelWorkBookParameters: function (sId, sLabel, sProperty, sType) {
			var oExcelCoumn = {
				columnId: sId,
				displayUnit: false,
				falseValue: undefined,
				label: sLabel,
				precision: undefined,
				property: sProperty,
				scale: undefined,
				template: null,
				textAlign: "End",
				trueValue: undefined,
				type: sType,
				unitProperty: undefined,
				width: ""
			};
			return oExcelCoumn;
		}
	});
});