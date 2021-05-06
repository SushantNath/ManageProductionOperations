/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["i2d/mpe/operations/manages2/controller/BaseController", "sap/ui/model/json/JSONModel",
	"i2d/mpe/operations/manages2/model/formatter", "sap/ui/model/Filter", "sap/i2d/mpe/lib/aors1/AOR/AORFragmentHandler",
	"sap/i2d/mpe/lib/popovers1/fragments/IssuePopOverController", "sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
	"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController",
	"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderOperationsController", "sap/i2d/mpe/lib/popovers1/fragments/WorkCenterController",
	"sap/i2d/mpe/lib/commons1/utils/saveAsTile", "sap/i2d/mpe/lib/commons1/utils/util",
	"sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus", "sap/m/MessageToast", "sap/m/MessageBox",
	"sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog", "sap/i2d/mpe/lib/commons1/utils/constants",
	"sap/i2d/mpe/lib/commons1/fragments/OrdSpcfcChange", "sap/i2d/mpe/lib/commons1/utils/NavHelper", "sap/m/PDFViewer", "sap/m/MessageBox"
], function(B, J, f, F, A, I, M, P, c, W, T, R, O, d, e, g, h, j, N, PDFViewer, MessageBox) {
	"use strict";
	return B.extend("i2d.mpe.operations.manages2.controller.Worklist", {
		formatter: f,
		onInit: function() {
			this.bAORFilterFlag = false;
			this.bAORDeleted = false;
			this.bOnAfterRenderExecuted = false;
			this.bPersServiceExecuted = false;
			this._oSmartFilter = this.getView().byId("idSmartFilterBar");
			this._oVariantMgt = this.getView().byId("idSmartVManagement");
			this._osmartTable = this.getView().byId("idMonitorOperationsTable");
			this._oOperationOrderReleaseButton = this.getView().byId("idOperationOrderReleaseButton");
			var t = this;
			sap.ushell.Container.getService("Personalization").getContainer("i2d.mpe.Supervisor").done(function(b) {
				t.bPersServiceExecuted = true;
				if (b.getItemValue("AssignedSupervisors")) {
					t.AssignedSupervisor = b.getItemValue("AssignedSupervisors");
				}
				if (b.getItemValue("AssignedWorkcenters")) {
					t.AssignedWorkcenter = b.getItemValue("AssignedWorkcenters");
				}
				if (t.bOnAfterRenderExecuted) {
					t.loadAORData();
				}
			});
			var E = sap.ui.getCore().getEventBus();
			var o = this.getEventBusParameters();
			E.subscribe(o.ApplyHoldDialog.Channel, o.ApplyHoldDialog.Event, o.ApplyHoldDialog.Callback, this);
			this._osmartTable.setIgnoreFromPersonalisation(
				"ManufacturingOrder,Material,WorkCenter,OpLtstSchedldExecStrtDte,OpLtstSchedldExecStrtTme,OpLtstSchedldExecEndDte,OpLtstSchedldExecEndTme,OpActualExecutionStartDate,OpActualExecutionStartTime,OpActualExecutionEndDate,OpActualExecutionEndTime"
			);
			this.sSelectedVariant = "";
			var C = sap.ui.core.Component.getOwnerIdFor(this.getView());
			var a = sap.ui.component(C);
			if (a && a.getComponentData() && a.getComponentData().startupParameters && a.getComponentData().startupParameters.VariantID) {
				this.sSelectedVariant = decodeURIComponent(a.getComponentData().startupParameters.VariantID[0]);
			}
			this.getRouter().getRoute("worklist").attachPatternMatched(this.handleRouteMatched, this);
			E.subscribe("AppState", "handleAppstateChanges", this.handleAppStateChanges, this);
			this.oMaterialPop = new M();
			this.oProductionOrderOperationPop = new c();
			this.oProductionOrderPop = new P();
			this.oWorkCenterPop = new W();
			R.setWorklistCtrlReference(this);
			this.getOwnerComponent().setModel(new J({
				EditButtonNavigable: true,
				EditButtonVisible: false,
				ConfirmButtonVisible: true,
				bIsHoldButtionVisible: false,
				bIsOrderSpecificHoldAvailable: false,
				bIsOrderSpecificHoldVisible: false,
				bIsDisplayOrderSpecificHoldAvailable: true,
				bIsDisplayOrderSpecificHoldVisible: false
			}), "ActionButtonVisiblity");
			if (sap.ushell && sap.ushell.Container) {
				var s = sap.ushell.Container.getService("CrossApplicationNavigation");
				var S = [];
				S.push("#ProductionOrderConfirmation-createTimeTicket", "#ProductionOrder-change", "#ShopFloorRouting-change");
				s.isIntentSupported(S).done(function(b) {
					if (b) {
						this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/EditButtonNavigable", b["#ProductionOrder-change"].supported);
						this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/ConfirmButtonVisible", b[
							"#ProductionOrderConfirmation-createTimeTicket"].supported);
						this.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldAvailable", b[
							"#ShopFloorRouting-change"].supported);
					}
				}.bind(this)).fail(function() {
					jQuery.sap.log.error("Reading intent data failed.");
				});
			} else {
				jQuery.sap.log.error("ushell not available");
			}
		},
		ApplyFilterOnAOR: function(s, S) {
			this.AssignedSupervisor = s;
			this.AssignedWorkcenter = S;
			if ((this.AssignedSupervisor && this.AssignedSupervisor !== null && this.AssignedSupervisor.length > 0) || (this.AssignedWorkcenter &&
					this.AssignedWorkcenter !== null && this.AssignedWorkcenter.length > 0)) {
				this.bAORDeleted = false;
			} else {
				this.bAORDeleted = true;
			}
			this.bAORFilterFlag = true;
			this._osmartTable.rebindTable();
			T.updateTileCountURL(this);
		},
		onAfterRendering: function() {
			var t = this;
			this.getModel("HoldModel").metadataLoaded().then(function() {
				t.getOwnerComponent().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldAvailable", R.checkOrdSpcfcChangeAvailable(
					t.getModel("HoldModel")));
			});
			this.setCustomFiltersData();
			var p = this.getView().getId();
			var s = p.split("-");
			this.oSemanticObj = "#" + s[1] + "-" + s[2];
			if (!this.bOnAfterRenderExecuted && this.bPersServiceExecuted) {
				this.loadAORData();
			}
			this.bOnAfterRenderExecuted = true;
		},
		loadAORData: function() {
			var t = this;
			if ((t.AssignedWorkcenter && t.AssignedWorkcenter !== null && t.AssignedWorkcenter.length > 0) || (t.AssignedSupervisor && t.AssignedSupervisor !==
					null && t.AssignedSupervisor.length > 0)) {
				A.loadSFCSettingsMenuOption(t, "i2d.mpe.Supervisor", true);
				this.bAORDeleted = false;
				this.bAORFilterFlag = true;
			} else {
				this.bAORDeleted = true;
				A.loadSFCSettingsMenuOption(t, "i2d.mpe.Supervisor", false);
			}
		},
		handleAppStateChanges: function(E, a, C) {
			var s = this.getView().byId("idSmartFilterBar");
			if (C.bDirtyFlag) {
				this._oVariantMgt.currentVariantSetModified(true);
			}
			if (C.VariantState && C.VariantState !== "") {
				s.setCurrentVariantId(C.variantId);
				s.applyVariant(C.VariantState);
			}
			var i = this.getOwnerComponent().getModel("AppState");
			if (C.issuesFilter) {
				s.getControlByKey("CustomIssue").setSelectedKeys(C.issuesFilter);
				i.getProperty("/appState").issuesFilter = C.issuesFilter;
			}
			if (C.delayFilter || C.delayFilter === "") {
				s.getControlByKey("CustomDelay").setSelectedKey(C.delayFilter);
				i.getProperty("/appState").delayFilter = C.delayFilter;
			}
			if (C.statusFilter) {
				s.getControlByKey("CustomStatus").setSelectedKeys(C.statusFilter);
				i.getProperty("/appState").statusFilter = C.statusFilter;
			}
			if (C.confirmationFilter) {
				s.getControlByKey("CustomConfirmation").setSelectedKey(C.confirmationFilter);
				i.getProperty("/appState").confirmationFilter = C.confirmationFilter;
			}
			if (this._osmartTable.getTable().getShowOverlay()) {
				this._osmartTable.rebindTable();
			}
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},
		onCategorySelectionFinish: function(E) {
			var C = this.getView().byId("idSmartFilterBar");
			C.fireFilterChange(E);
		},
		handleRouteMatched: function(E) {
			this.sAppState = E.getParameter("arguments").iAppState;
			var C = E.getParameter("config").name;
			this.getOwnerComponent().extractInnerAppStateFromURL(this.sAppState, C);
			var i = this.getOwnerComponent().getModel("AppState");
			var p = i.getProperty("/appState");
			p.selectedOrderData = undefined;
			i.setProperty("/appState", p);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
			var o = this.getView().getModel("DetailModel");
			var a = o.getData();
			a.selectedOrderData = undefined;
			o.setData(a);
			this.getModel().setUseBatch(true);
			if (a.bReleasedSuccess) {
				a.bReleasedSuccess = false;
				o.setData(a);
				this._osmartTable.rebindTable();
			}
		},
		getI18NText: function(i, v) {
			return this.getResourceBundle().getText(i, v);
		},
		setCustomFiltersData: function() {
			this.oCustomFilter = {};
			this.oCustomFilter.issues = [{
				id: "All",
				name: this.getI18NText("AllIssues")
			}, {
				id: "Delay",
				name: this.getI18NText("Delay")
			}, {
				id: "ComponentIssue",
				name: this.getI18NText("ComponentIssue")
			}, {
				id: "QuantityIssue",
				name: this.getI18NText("QuantityIssue")
			}, {
				id: "QualityIssue",
				name: this.getI18NText("QualityIssue")
			}, {
				id: "ProductionHold",
				name: this.getI18NText("ProductionHold")
			}];
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
			var l = new J(this.oCustomFilter);
			this.getView().setModel(l, "customFiltersModel");
		},
		setFiltersData: function(H) {
			this.oCustomFilter = {};
			if (H === true || H === "X") {
				this.oCustomFilter.issues = [{
					id: "All",
					name: this.getI18NText("AllIssues")
				}, {
					id: "Delay",
					name: this.getI18NText("Delay")
				}, {
					id: "ComponentIssue",
					name: this.getI18NText("ComponentIssue")
				}, {
					id: "QuantityIssue",
					name: this.getI18NText("QuantityIssue")
				}, {
					id: "QualityIssue",
					name: this.getI18NText("QualityIssue")
				}, {
					id: "ProductionHold",
					name: this.getI18NText("ProductionHold")
				}];
			} else {
				this.oCustomFilter.issues = [{
					id: "All",
					name: this.getI18NText("AllIssues")
				}, {
					id: "Delay",
					name: this.getI18NText("Delay")
				}, {
					id: "ComponentIssue",
					name: this.getI18NText("ComponentIssue")
				}, {
					id: "QuantityIssue",
					name: this.getI18NText("QuantityIssue")
				}, {
					id: "QualityIssue",
					name: this.getI18NText("QualityIssue")
				}];
			}
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
			var l = new J(this.oCustomFilter);
			this.getView().setModel(l, "customFiltersModel");
		},
		onDataReceived: function(E) {
			if (E.getParameters().getParameters().data && E.getParameters().getParameters().data.results && E.getParameters().getParameters().data
				.results[0]) {
				var C = E.getParameters().getParameters().data.results;
				var H = C[0].MfgFeatureIsActiveInAnyPlant;
				this.setFiltersData(H);
			}
		},
		handleBeforeRebindTable: function(E) {
			this.sAORFilterString = "";
			var b = E.getParameter("bindingParams");
			b.preventTableBind = false;
			this.ChangeSTableNoDataText();
			if (!this.bAORFilterFlag) {
				b.preventTableBind = true;
				return;
			}
			var t = b.filters;
			var a = b.sorter;
			var s = new sap.ui.model.Sorter("OperationStatusInternalID", true);
			a.push(s);
			var S = new sap.ui.model.Sorter("OperationStartDate", true);
			a.push(S);
			var i = new sap.ui.model.Sorter("OpLtstSchedldExecStrtTme", true);
			a.push(i);
			var o = A.updateAORFilters(this);
			var k = this.updateIssueCustomFilter();
			var l = this.updateDelayFilter();
			var m = this.updateStatusFilter();
			var n = this.updateRelOperationsFilter();
			var p = new sap.ui.model.Filter([], true);
			if (l.aFilters.length > 0) {
				p.aFilters.push(l);
			}
			if (k.aFilters.length > 0) {
				p.aFilters.push(k);
			}
			if (m.aFilters.length > 0) {
				p.aFilters.push(m);
			}
			if (n.aFilters.length > 0) {
				p.aFilters.push(n);
			}
			var q;
			if (this.getOwnerComponent().getModel()) {
				q = this.getOwnerComponent().getModel();
			} else {
				q = this.getView().getModel();
			}
			if (o.aFilters.length > 0 && q && q.getServiceMetadata()) {
				var v = q.oMetadata;
				var r = q.getServiceMetadata().dataServices.schema[0].entityType;
				var u = "";
				for (var C = 0; C < r.length; C++) {
					if (q.getServiceMetadata().dataServices.schema[0].entityType[C].name === "C_ManageoperationsType") {
						u = q.getServiceMetadata().dataServices.schema[0].entityType[C];
					}
				}
				this.sAORFilterString = sap.ui.model.odata.ODataUtils.createFilterParams(o.aFilters, v, u);
				this.sAORFilterString = this.sAORFilterString.replace("$filter=", "");
				p.aFilters.push(o);
			}
			if (t[0] && t[0].aFilters) {
				var w = t[0];
				t[0] = new sap.ui.model.Filter([w, p], true);
			} else if (p.aFilters.length > 0) {
				if (p.aFilters.length > 0) {
					t.push(p);
				}
			}
		},
		//Code for opeining pdf/packaging instruction
		/*	onOpenPackaging: function (E) {
				//	var oPdfModel = this.getOwnerComponent().getModel("oPdfModel");
				//	 var materialNo = "000000000006303262";

				var C = E.getSource().getBindingContext();
				var m = C.getModel();
				var s = m.getProperty("Material", C);

				window.open("/sap/opu/odata/sap/ZPTM_GET_MAT_PKGNG_INST_PDF_SRV/PDFDocumentSet('" + s + "')/$value");

				// 	var sUrl = "https://itbolde4as01.boltongroup.root.dom:44300/sap/opu/odata/sap/ZPTM_GET_MAT_PKGNG_INST_PDF_SRV/PDFDocumentSet('000000000006303262')/$value";
				// //	var oPdfModel = this.getOwnerComponent().getModel("pdfModel");
				// this._pdfViewer = new PDFViewer();
				// this.getView().addDependent(this._pdfViewer);
				// this._pdfViewer.setSource(sUrl);
				// this._pdfViewer.open();

			}, */

		handleIconPressPdf: function(E) {

			//	 var materialNo = "000000000006303262";

			var C = E.getSource().getBindingContext();
			var m = C.getModel();
			var s = m.getProperty("Material", C);

			window.open("/sap/opu/odata/sap/ZPTM_GET_MAT_PKGNG_INST_PDF_SRV/PDFDocumentSet('" + s + "')/$value");

		},

		handleTableItemSelection: function(E) {
			var t = E.getSource().getSelectedItems();
			var p, r;
			for (var i = 0; i < t.length; i++) {
				p = t[i].getBindingContext().getObject();
				if (p.OperationIsCreated !== "X") {
					r = true;
					break;
				} else {
					r = false;
				}
			}
			if (t.length > 0 && !r) {
				this._oOperationOrderReleaseButton.setEnabled(true);
			} else {
				this._oOperationOrderReleaseButton.setEnabled(false);
			}
			if (t.length === 1) {
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", (p.OrderIsShopFloorOrder === ""));
				// check license (EPO feature) and status of operation
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", f.getHoldButtonStatus(p));
			} else {
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", false);
			}
			var o = [],
				m = "";
			var operation;
			for (i = 0; i < t.length; i++) {
				var a = t[i].getBindingContext().getObject();
				if (m === "") {
					m = a.ManufacturingOrder;
					operation = a.ManufacturingOrderOperation;
				}
				if (f.isOperationChangePossible(a) && m === a.ManufacturingOrder) {
					o.push(a);
				} else {
					o = [];
					break;
				}
			}
			this.orderNumber = m;
			this.operationNum = operation;

			if (o.length > 0) {
				R.checkOprHasOpenOrdSpcfcChange(this.getModel("OSR"), o, function(D) {
					if (D.results.length === 0) {
						this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsDisplayOrderSpecificHoldVisible", false);
						this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsOrderSpecificHoldVisible", true);
					} else {
						this.getView().getModel("ActionButtonVisiblity").setProperty("/oOrderSpecificChangeDetails", D.results[0]);
						if (D.results[0].BillOfOperationsVersionStatus === "10") {
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
		handleReleaseButton: function(E) {
			var t = this._osmartTable.getTable().getSelectedItems();
			t = t.sort(function(a, b) {
				var n = a.getBindingContext().sPath.substring(51, 61) - b.getBindingContext().sPath.substring(51, 61);
				if (n !== 0) {
					return n;
				}
				return a.getBindingContext().oModel.getProperty(a.getBindingContext().sPath).ManufacturingOrderOperation - b.getBindingContext()
					.oModel.getProperty(b.getBindingContext().sPath).ManufacturingOrderOperation;
			});
			var k = 0,
				s = {
					aError: [],
					aWarning: []
				};
			var l = this.getView().getModel();
			var p = {
				"method": "POST",
				"urlParameters": {
					"OrderInternalBillOfOperations": "",
					"OrderIntBillOfOperationsItem": ""
				},
				"success": function(D, r) {
					k++;
					if (r.headers["sap-message"]) {
						var a = JSON.parse(r.headers["sap-message"]);
						if (a.severity === "error" || a.severity === "warning") {
							if (a.severity === "error") {
								a.order = D.ManufacturingOrder;
								s.aError.push(a);
							} else {
								a.order = D.ManufacturingOrder;
								s.aWarning.push(a);
							}
						}
						for (var i = 0; i < a.details.length; i++) {
							if (a.details[i].severity === "error" || a.details[i].severity === "warning") {
								if (a.details[i].severity === "error") {
									a.details[i].order = D.ManufacturingOrder;
									s.aError.push(a.details[i]);
								} else {
									a.details[i].order = D.ManufacturingOrder;
									s.aWarning.push(a.details[i]);
								}
							}
						}
					}
					if (k === t.length) {
						var b, n, C, z;
						if (s.aError.length > 0) {
							b = this.getI18NText("operationReleaseRequestErrorMSG", [s.aError.length, t.length]);
							n = s.aError[0].message;
							for (z = 1; z < s.aError.length; z++) {
								n = n + "\n" + s.aError[z].message;
							}
							if (s.aWarning.length > 0) {
								for (z = 0; z < s.aWarning.length; z++) {
									n = n + "\n" + s.aWarning[z].message;
								}
								b = this.getI18NText("operationReleaseErrorAndWarningMSG", [s.aError.length, s.aWarning.length]);
							}
							C = !!this.getView().$().closest(".sapUiSizeCompact").length;
							this.getDynamicMessageBox(b, e.Icon.ERROR, this.getI18NText("ErrorPopupTitle"), [e.Action.CLOSE], "operationReleaseOrderMSG",
								n, C);
						} else if (s.aWarning.length > 0) {
							b = this.getI18NText("operationReleaseWarningMSG", [s.aWarning.length, t.length]);
							n = s.aWarning[0].message;
							for (z = 1; z < s.aWarning.length; z++) {
								n = n + "\n" + s.aWarning[z].message;
							}
							C = !!this.getView().$().closest(".sapUiSizeCompact").length;
							this.getDynamicMessageBox(b, e.Icon.WARNING, this.getI18NText("WarningPopupTitle"), [e.Action.CLOSE],
								"operationReleaseOrderMSG", n, C);
							for (i = 0; i < t.length; i++) {
								t[i].setSelected(false);
							}
							this._oOperationOrderReleaseButton.setEnabled(false);
						} else {
							b = this.getI18NText("operationOrderReleasedSuccessMSG", [k, t.length]);
							d.show(b, {
								duration: 5000
							});
							for (i = 0; i < t.length; i++) {
								t[i].setSelected(false);
							}
							this._oOperationOrderReleaseButton.setEnabled(false);
						}
					}
				}.bind(this),
				"error": function(a) {
					d.show("Release failed");
					this._oOperationOrderReleaseButton.setEnabled(false);
				}.bind(this)
			};
			var o, m;
			for (var q = 0; q < t.length; q++) {
				o = t[q];
				m = o.getBindingContext().sPath;
				p.urlParameters.OrderInternalBillOfOperations = m.substring(51, 61);
				p.urlParameters.OrderIntBillOfOperationsItem = m.substring(93, 101);
				l.callFunction("/C_ManageoperationsReleaseoperation", p);
			}
		},
		handleHoldButton: function(E) {
			var i = this._osmartTable.getTable().getSelectedItems();
			var p = i[0].getBindingContext().sPath;
			var o = i[0].getBindingContext().oModel.getProperty(p).ManufacturingOrder;
			var m = i[0].getBindingContext().oModel.getProperty(p).Material;
			var s = i[0].getBindingContext().oModel.getProperty(p).ProductionPlant;
			var w = i[0].getBindingContext().oModel.getProperty(p).WorkCenter;
			var a = i[0].getBindingContext().oModel.getProperty(p).OrderOperationInternalID;
			var b = p.substring(51, 61);
			var k = p.substring(93, 101);
			var H = [];
			for (var C = 0; C < i.length; C++) {
				var p = i[C].getBindingContext().sPath;
				var o = i[C].getBindingContext().oModel.getProperty(p).ManufacturingOrder;
				var m = i[C].getBindingContext().oModel.getProperty(p).Material;
				var s = i[C].getBindingContext().oModel.getProperty(p).ProductionPlant;
				var w = i[C].getBindingContext().oModel.getProperty(p).WorkCenter;
				var a = i[C].getBindingContext().oModel.getProperty(p).OrderOperationInternalID;
				var b = p.substring(51, 61);
				var k = p.substring(93, 101);
				var l = {
					ManufacturingOrder: o,
					ProductionPlant: s,
					Material: m,
					OrderOperationInternalID: k,
					WorkCenter: w,
					OrderInternalID: b
				};
				H.push(l);
			}
			var n = [h.HOLD.TYPE_ORDER, h.HOLD.TYPE_MATERIAL, h.HOLD.TYPE_WORKCENTER, h.HOLD.TYPE_OPERATION];
			g.initAndOpen(l, this.getModel("HoldModel"), n, H, h.HOLD.TYPE_OPERATION, true);
			var q = this.getEventBusParameters();
			var r = sap.ui.getCore().getEventBus();
			g.setEventBusParameters(r, q.ApplyHoldDialog.Channel, q.ApplyHoldDialog.Event);
		},
		getEventBusParameters: function() {
			var E = {
				ApplyHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages2",
					Event: "onHoldSuccessfullyApplied",
					Callback: this.onHoldSuccessfullyComplete
				}
			};
			return E;
		},
		onHoldSuccessfullyComplete: function(C, E, r) {
			var m, s;
			var t = this._osmartTable.getTable().getSelectedItems();
			if (r.success) {
				this._osmartTable.rebindTable();
				if (r.info) {
					m = r.info;
					d.show(m);
					for (var i = 0; i < t.length; i++) {
						t[i].setSelected(false);
					}
				}
				this._oOperationOrderReleaseButton.setEnabled(false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
			} else {
				var b = !!this.getView().$().closest(".sapUiSizeCompact").length;
				if (r.detail || r.info) {
					m = r.info;
					s = r.detail;
					this.getDynamicMessageBox(m, e.Icon.ERROR, "Error", [e.Action.CLOSE], "ErrorOrderMSG", s, b);
				}
				this._oOperationOrderReleaseButton.setEnabled(false);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", true);
				this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
			}
		},
		getDynamicMessageBox: function(m, i, s, a, b, k, C) {
			e.show(m, {
				icon: i ? i : e.Icon.NONE,
				title: s ? s : "",
				actions: a ? a : e.Action.OK,
				id: b ? b : "DefaultMessageBoxId",
				details: k ? k : "Error",
				styleClass: C ? "sapUiSizeCompact" : ""
			});
		},
		updateStatusFilter: function() {
			var o = new sap.ui.model.Filter([], false);
			var s = [];
			if (this._oSmartFilter.getControlByKey("CustomStatus")) {
				s = this._oSmartFilter.getControlByKey("CustomStatus").getSelectedKeys();
			} else {
				s = this.getView().byId("idCustomStatusMultiSelectBox").getSelectedKeys();
			}
			for (var i = 0; s.length > i; i++) {
				if (s[i]) {
					if (s[i] !== "All") {
						o.aFilters.push(new sap.ui.model.Filter("OperationStatusInternalID", sap.ui.model.FilterOperator.EQ, s[i]));
					}
				}
			}
			return o;
		},
		_getStatusFieldValue: function(s) {
			var S = "";
			switch (s) {
				case "01":
					S = "OperationIsCreated";
					break;
				case "02":
					S = "OperationIsScheduled";
					break;
				case "03":
					S = "OperationIsReleased";
					break;
				case "04":
					S = "OperationIsPartiallyConfirmed";
					break;
				case "05":
					S = "OperationIsConfirmed";
					break;
				case "06":
					S = "OperationIsPartiallyDelivered";
					break;
				case "07":
					S = "OperationIsDelivered";
					break;
				case "08":
					S = "OperationIsTechlyCompleted";
					break;
				case "09":
					S = "OperationIsClosed";
					break;
				case "10":
					S = "OperationIsDeleted";
					break;
			}
			return S;
		},
		updateIssueCustomFilter: function() {
			var o = new sap.ui.model.Filter([], false);
			var s = [];
			if (this._oSmartFilter.getControlByKey("CustomIssue")) {
				s = this._oSmartFilter.getControlByKey("CustomIssue").getSelectedKeys();
			}
			for (var i = 0; s.length > i; i++) {
				if (s[i]) {
					if (s[i] === "Delay" || s[i] === "All") {
						o.aFilters.push(new sap.ui.model.Filter("OperationExecutionStartIsLate", sap.ui.model.FilterOperator.EQ, true));
						o.aFilters.push(new sap.ui.model.Filter("OperationExecutionEndIsLate", sap.ui.model.FilterOperator.EQ, true));
					} else if (s[i] === "QuantityIssue" || s[i] === "All") {
						o.aFilters.push(new sap.ui.model.Filter("OperationYieldDeviationQty", sap.ui.model.FilterOperator.LT, 0));
					} else if (s[i] === "ComponentIssue" || s[i] === "All") {
						o.aFilters.push(new sap.ui.model.Filter("OperationHasMissingComponents", sap.ui.model.FilterOperator.Contains, "X"));
					} else if (s[i] === "QualityIssue" || s[i] === "All") {
						o.aFilters.push(new F("OperationHasScrapQualityIssue", sap.ui.model.FilterOperator.Contains, "X"));
						o.aFilters.push(new F("InspHasRejectedCharc", sap.ui.model.FilterOperator.Contains, "X"));
						o.aFilters.push(new F("InspHasRejectedInspSubset", sap.ui.model.FilterOperator.Contains, "X"));
						o.aFilters.push(new F("InspHasRejectedInspLot", sap.ui.model.FilterOperator.Contains, "X"));
					} else if (s[i] === "ProductionHold" || s[i] === "All") {
						o.aFilters.push(new sap.ui.model.Filter("OperationHasProductionHold", sap.ui.model.FilterOperator.EQ, true));
					}
				}
			}
			return o;
		},
		updateDelayFilter: function() {
			var s = [];
			if (this._oSmartFilter.getControlByKey("CustomDelay")) {
				s = this._oSmartFilter.getControlByKey("CustomDelay").getSelectedKey();
			}
			var o = new sap.ui.model.Filter([], false);
			if (s && s.length > 0) {
				o.aFilters.push(new sap.ui.model.Filter("ExecutionEndLatenessInHours", sap.ui.model.FilterOperator.GT, s));
				o.aFilters.push(new sap.ui.model.Filter("ExecutionStartLatenessInHours", sap.ui.model.FilterOperator.GT, s));
			}
			return o;
		},
		updateRelOperationsFilter: function() {
			var s = [];
			if (this._oSmartFilter.getControlByKey("CustomConfirmation")) {
				s = this._oSmartFilter.getControlByKey("CustomConfirmation").getSelectedItems();
			}
			var o = new sap.ui.model.Filter([], false);
			for (var i = 0; s.length > i; i++) {
				if (s[i].getKey() === "1") {
					o.aFilters.push(new sap.ui.model.Filter("ConfirmationIsNotPossible", sap.ui.model.FilterOperator.NE, true));
				}
				if (s[i].getKey() === "2") {
					o.aFilters.push(new sap.ui.model.Filter("ConfirmationIsNotPossible", sap.ui.model.FilterOperator.EQ, true));
				}
			}
			return o;
		},
		handleVariantFetch: function() {
			var v = this._oVariantMgt;
			var V = v.getVariantItems();
			var s = null;
			var a = null;
			var b = [];
			if (V.length > 0) {
				for (var C = 0; C < V.length; C++) {
					a = V[C].getKey();
					s = V[C].getText();
					var o = {
						vKey: a,
						vName: s
					};
					b.push(o);
				}
			}
			this._aVariants = b;
		},
		handleVariantLoad: function() {
			var C = this._oSmartFilter.getFilterData();
			this.oFilterData = this._oSmartFilter.getFilterData();
			if (C._CUSTOM) {
				var o = C._CUSTOM;
				if (o.Issues) {
					this._oSmartFilter.getControlByKey("CustomIssue").setSelectedKeys(o.Issues);
				} else {
					this._oSmartFilter.getControlByKey("CustomIssue").setSelectedKeys([]);
				}
				if (o.Delay) {
					this._oSmartFilter.getControlByKey("CustomDelay").setSelectedKey(o.Delay);
				} else {
					this._oSmartFilter.getControlByKey("CustomDelay").setSelectedKey("");
				}
				if (o.Status) {
					this._oSmartFilter.getControlByKey("CustomStatus").setSelectedKeys(o.Status);
				} else {
					this._oSmartFilter.getControlByKey("CustomStatus").setSelectedKeys([]);
				}
				if (o.Confirmation) {
					this._oSmartFilter.getControlByKey("CustomConfirmation").setSelectedKeys(o.Confirmation);
				} else {
					this._oSmartFilter.getControlByKey("CustomConfirmation").setSelectedKeys([]);
				}
			}
			if (this._oVariantMgt.getCurrentVariantId() === "") {
				this.bAssignDefaultStatusFilter = true;
			}
		},
		handleOperationSelect: function(E) {
			var o = E.getParameter("listItem").getBindingContextPath();
			var s = E.getParameter("listItem").getBindingContext().getObject();
			var a = o.substr(1);
			this.updateOperationDetailModel(a, s);
			var i = this.getOwnerComponent().getModel("AppState");
			var p = i.getProperty("/appState");
			p.selectedOrderData = s;
			i.setProperty("/appState", p);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
			this.getRouter().navTo("object", {
				operationId: o.substr(1),
				iAppState: this.sAppState
			}, false);
		},
		updateOperationDetailModel: function(o, s) {
			var a = this.getView().getModel("DetailModel");
			var b = a.getData();
			b.orderId = o;
			b.WorkCenterInternalID = s.WorkCenterInternalID;
			b.ProductionPlant = s.ProductionPlant;
			b.selectedOrderData = s;
			a.setData(b);
		},
		handleStatusSelectionChange: function(E) {
			this.getView().getModel("ActionButtonVisiblity").setProperty("/bIsHoldButtionVisible", false);
			var C = "statusFilter";
			this.handleSelectAllOptionOfMultiSelectBox(E, C);
			var o = E.getSource().getSelectedItems();
			if (o.length > 0) {
				E.getSource().data("hasValue", true);
			} else {
				E.getSource().data("hasValue", false);
			}
		},
		handleIssueSelectionChange: function(E) {
			var C = "issuesFilter";
			this.handleSelectAllOptionOfMultiSelectBox(E, C);
		},
		handleSelectAllOptionOfMultiSelectBox: function(E, C) {
			var s = E.getSource();
			var S = E.getParameter("changedItem").getProperty("key");
			var a = s.getProperty("selectedKeys");
			if (S && (S === "All") && (E.getParameter("selected"))) {
				s.setSelectedItems(s.getItems());
				a = s.getSelectedKeys();
				this.updateAppStateforCustomFilters(a, C);
			} else if (S && (S === "All") && (!E.getParameter("selected"))) {
				s.setSelectedItems([]);
				a = [];
			} else {
				if (a.indexOf("All") !== -1) {
					a.splice(a.indexOf("All"), 1);
					s.setSelectedKeys(a);
				} else {
					var n = s.getItems().length;
					var i = a.length;
					var D = n - i;
					if (D === 1) {
						s.setSelectedItems(s.getItems());
						a = s.getSelectedKeys();
					}
				}
			}
			this.updateAppStateforCustomFilters(a, C);
		},
		handleDelayFilter: function(E) {
			var i = E.getParameter("selectedItem");
			var s = i.getKey();
			var C = "delayFilter";
			this.updateAppStateforCustomFilters(s, C);
		},
		handleRelOperationChange: function(E) {
			var C = "confirmationFilter";
			this.updateAppStateforCustomFilters(E, C);
		},
		handleFilterChange: function(E) {
			this.handleAppstateUpdate(E);
		},
		updateAppStateforCustomFilters: function(k, C) {
			var i = this.getOwnerComponent().getModel("AppState");
			i.getProperty("/appState")[C] = k;
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},
		handleAppstateUpdate: function(l) {
			var i = this.getOwnerComponent().getModel("AppState");
			var p = i.getProperty("/appState");
			p.variantId = l.getSource().getCurrentVariantId();
			p.VariantState = l.getSource().fetchVariant();
			p.bDirtyFlag = this._oVariantMgt.currentVariantGetModified();
			i.setProperty("/appState", p);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},
		/* Sorting logic will go here*/

		handleBeforeVariantSave: function(E, G) {
			var C = {
				_CUSTOM: {
					Issues: "",
					Delay: "",
					Status: "",
					Confirmation: ""
				}
			};
			if (this._oSmartFilter.getControlByKey("CustomIssue").getSelectedKeys()) {
				var a = this._oSmartFilter.getControlByKey("CustomIssue").getSelectedKeys();
				C._CUSTOM.Issues = a;
			}
			if (this._oSmartFilter.getControlByKey("CustomDelay").getSelectedKey()) {
				C._CUSTOM.Delay = this._oSmartFilter.getControlByKey("CustomDelay").getSelectedKey();
			}
			if (this._oSmartFilter.getControlByKey("CustomStatus").getSelectedKeys()) {
				var s = this._oSmartFilter.getControlByKey("CustomStatus").getSelectedKeys();
				C._CUSTOM.Status = s;
			}
			if (this._oSmartFilter.getControlByKey("CustomConfirmation").getSelectedKeys()) {
				var b = this._oSmartFilter.getControlByKey("CustomConfirmation").getSelectedKeys();
				C._CUSTOM.Confirmation = b;
			}
			var o = this._oSmartFilter.getFilterData();
			o._CUSTOM = C._CUSTOM;
			var D = this._oVariantMgt.currentVariantGetModified();
			var S = this._oSmartFilter.getBasicSearchControl().getValue();
			this._oSmartFilter.setFilterData(o, true);
			if (S !== "") {
				this._oSmartFilter.getBasicSearchControl().setValue(S);
			}
			this._oSmartFilter.fireFilterChange();
			if (D !== this._oVariantMgt.currentVariantGetModified()) {
				this._oVariantMgt.currentVariantSetModified(D);
				this._callHandleAppStateUpdate();
			}
			var t = this._osmartTable.getTable().getSelectedItems();
			for (var i = 0; i < t.length; i++) {
				t[i].setSelected(false);
			}
			this._oOperationOrderReleaseButton.setEnabled(false);
			this.getView().getModel("ActionButtonVisiblity").setProperty("/EditButtonVisible", false);
			if (this._osmartTable.getTable().getShowOverlay()) {
				if (!G) {
					this._osmartTable.rebindTable();
				}
			}
			var k = this.getOwnerComponent().getModel("AppState");
			var p = k.getProperty("/appState");
			p.VariantTableState = JSON.stringify(this._osmartTable.fetchVariant());
			k.setProperty("/appState", p);
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},
		handleAfterVariantSave: function(E) {
			if (this.bCreateTileSelected) {
				var s = "";
				var S = this.getView().byId("idMonitorOperationsTable");
				if (S.getTable().getBindingInfo('items')) {
					s = S.getTable().getBindingInfo('items').binding.sFilterParams;
				}
			}
			T.updatePersonalizationContainer(this, this.getView().byId("idMonitorOperationsTable").getEntitySet(), s);
			this.bCreateTileSelected = false;
			this.handleAppstateUpdate(E);
			if (this._osmartTable.getTable().getShowOverlay()) {
				this._osmartTable.getTable().setShowOverlay(false);
			}
		},
		loadInitialVariant: function() {
			var v = this._oVariantMgt;
			var V = this.sSelectedVariant;
			if (v && V !== "") {
				var s;
				var a = v.getVariantItems();
				for (var C = 0; C < a.length; C++) {
					if (a[C].getText().trim() === V.trim()) {
						s = a[C].getKey();
						break;
					}
				}
				if (s) {
					v.setCurrentVariantId(s);
				}
			}
			this._oSmartFilter.determineFilterItemByName("CustomStatus").setLabelTooltip(this.getI18NText("StatusFilter"));
			this._oSmartFilter.determineFilterItemByName("CustomConfirmation").setLabelTooltip(this.getI18NText("ConfirmationFilter"));
		},
		handleSaveVariant: function(E) {
			T.saveVariantAsTile(E, this, "idMonitorOperationsTable");
		},
		handleManageVariant: function(E) {
			T.manageVariant(E, this);
		},
		handleSelectVariant: function(E) {
			var s = this.getView().byId("idMonitorOrdersTable");
			var i = this.getOwnerComponent().getModel("AppState");
			var p = i.getProperty("/appState");
			jQuery.sap.delayedCall(1000, this, function() {
				p.VariantTableState = JSON.stringify(s.fetchVariant());
				i.setProperty("/appState", p);
				this._callHandleAppStateUpdate();
			});
		},
		handleIconPress: function(E) {
			var C = E.getSource().getColor();
			if (C === "#d9d9d9") {
				return "";
			} else {
				R.openIssuePopOver(E, this);
			}
		},
		handleMaterialLinkPress: function(E) {
			var C = E.getSource().getBindingContext();
			var m = C.getModel();
			var p = m.getProperty("ProductionPlant", C);
			var s = m.getProperty("Material", C);
			this.oMaterialPop.openMaterialPopOver(E, this, s, p);
		},
		handleOrderOperationPress: function(E) {
			this.oProductionOrderOperationPop.openOperationsPopOver(E, this);
		},
		handleOrderNumberPress: function(E) {
			var s = E.getSource();
			var p = s.getBindingContext().sPath;
			var o = s.getModel().getProperty(p);
			var m = o.ManufacturingOrder || o.MRPElement;
			this.oProductionOrderPop.openProdOrdPopOver(E, this, m);
		},
		handleWorkCenterPress: function(E) {
			this.oWorkCenterPop.openWorkCenterPopOver(E, this);
		},
		handleStatusLinkPress: function(E) {
			O.openStatusPopOver(E, this);
		},
		handleGOBtnPress: function() {
			this.handleBeforeVariantSave(undefined, "true");
		},
		ChangeSTableNoDataText: function() {
			if (this.bAORDeleted) {
				this._osmartTable.setNoData(this.getI18NText("AORDeleted"));
				this._osmartTable.getTable().setNoDataText(this.getI18NText("AORDeleted"));
			} else {
				this._osmartTable.setNoData(this.getI18NText("AORSelected"));
				this._osmartTable.getTable().setNoDataText(this.getI18NText("AORSelected"));
			}
		},
		_callHandleAppStateUpdate: function() {
			var E = {
				oSourceTemp: this._oSmartFilter,
				getSource: function() {
					return this.oSourceTemp;
				}
			};
			this.handleAppstateUpdate(E);
		},
		handleInspectionPress: function(E) {
			var C = E.getSource().getBindingContext().getObject();
			var p = {
				"InspectionLot": C.InspectionLot
			};
			var o = sap.ushell.Container.getService("CrossApplicationNavigation");
			o.toExternal({
				target: {
					semanticObject: "InspectionLot",
					action: "display"
				},
				params: p
			});
		},
		onPressOrdSpcfcChange: function(C) {
			var t = this,
				s = [],
				S = this._osmartTable.getTable().getSelectedItems(),
				b = S[0].getBindingContext().getObject().hasOwnProperty("BOOVersionChangeRecordIsRqd");
			var p = new jQuery.Deferred();
			if (b) {
				S.forEach(function(o) {
					s.push(o.getBindingContext().getObject());
				});
				p.resolve();
			} else {
				t.getView().getModel().read(S[0].getBindingContextPath(), {
					urlParameters: {
						$select: "BOOVersionChangeRecordIsRqd"
					},
					success: function(D) {
						S.forEach(function(o) {
							var a = o.getBindingContext().getObject();
							a.BOOVersionChangeRecordIsRqd = D.BOOVersionChangeRecordIsRqd;
							s.push(a);
						});
						p.resolve();
					},
					error: function() {
						S.forEach(function(o) {
							s.push(o.getBindingContext().getObject());
						});
						p.resolve();
					}
				});
			}
			p.done(function() {
				if (t._hasSameOrderNumber(s, s[0].ManufacturingOrder)) {
					j.initAndOpen({
						oHoldModel: t.getView().getModel("HoldModel"),
						oCRModel: t.getView().getModel("CR"),
						oOSRModel: t.getView().getModel("OSR"),
						oSelectedOrder: s,
						oOrderSpecificChangeDetails: t.getView().getModel("ActionButtonVisiblity").getProperty("/oOrderSpecificChangeDetails"),
						oCallBack: t.onOrdSpcfcChangeCallBack.bind(t),
						Ischangeforwholeorder: false
					});
				} else {
					sap.m.MessageBox.information(t.getI18NText("msgOnlyForSameOrder"));
				}
			});
		},
		_hasSameOrderNumber: function(o, m) {
			for (var i = 0; i < o.length; i++) {
				if (o[i].ManufacturingOrder !== m) {
					return false;
				}
			}
			return true;
		},
		onOrdSpcfcChangeCallBack: function() {
			this._osmartTable.rebindTable();
		},
		onPressDisplayOrdScpfcChange: function() {
			N.navToShopFloorRoutingChange(this.getView().getModel("ActionButtonVisiblity").getProperty("/oOrderSpecificChangeDetails"));
		},
		onExit: function() {
			var E = sap.ui.getCore().getEventBus();
			E.unsubscribe("AppState", "handleAppstateChanges", this.handleAppStateChanges, this);
			A.oAppSettingsButton.destroy();
			A.oAppSettingsButton = null;
		},
		handleEditPress: function() {
			var i = this._osmartTable.getTable().getSelectedItems();
			var p = i[0].getBindingContext().sPath;
			var o = i[0].getBindingContext().oModel.getProperty(p).ManufacturingOrder;
			R.editOrder(o);
		},
		handleBeforeExport: function(E) {
			var o = E.getParameter("exportSettings");
			var n = this.getExcelWorkBookParameters("testingScheduledStartDateFiled", this.getI18NText("OpLtstSchedldExecStrtDte"),
				"OpLtstSchedldExecStrtDte", "date");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingScheduledStartTimeFiled", this.getI18NText("OpLtstSchedldExecStrtTme"),
				"OpLtstSchedldExecStrtTme", "time");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingActualStartDateFiled", this.getI18NText("OpActualExecutionStartDate"),
				"OpActualExecutionStartDate", "date");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingActualStartTimeFiled", this.getI18NText("OpActualExecutionStartTime"),
				"OpActualExecutionStartTime", "time");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingScheduledEndDateFiled", this.getI18NText("OpLtstSchedldExecEndDte"),
				"OpLtstSchedldExecEndDte", "date");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingScheduledEndTimeFiled", this.getI18NText("OpLtstSchedldExecEndTme"),
				"OpLtstSchedldExecEndTme", "time");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingConfirmedEndDateFiled", this.getI18NText("OpActualExecutionEndDate"),
				"OpActualExecutionEndDate", "date");
			o.workbook.columns.push(n);
			n = this.getExcelWorkBookParameters("testingConfirmedEndTimeFiled", this.getI18NText("OpActualExecutionEndTime"),
				"OpActualExecutionEndTime", "time");
			o.workbook.columns.push(n);
		},

		//Function for trigerring product order confirmation app

		handleConfirmPress: function() {
			this.orderNumber;
			this.operationNum;
			this.appName = "manageProductionOperations";
			//code changes for Wricef 12704
			var navigationService = sap.ushell.Container.getService('CrossApplicationNavigation');

			if (this.getView().byId("idMonitorOperationsTable")._oTable._aSelectedPaths.length < 2) {

				var hash = navigationService.hrefForExternal({

					target: {
						semanticObject: "ZPTM_CONF",
						action: "display"
					},
					params: {
						"orderType": this.orderNumber,
						"operationNum": this.operationNum,
						"appName": this.appName

					}

				});

				var url = window.location.href.split('#')[0] + hash;

				sap.m.URLHelper.redirect(url, true);

			} else {

				MessageBox.error("Please select only one operation to proceed.");
			}

		},

		getExcelWorkBookParameters: function(i, l, p, t) {
			var E = {
				columnId: i,
				displayUnit: false,
				falseValue: undefined,
				label: l,
				precision: undefined,
				property: p,
				scale: undefined,
				template: null,
				textAlign: "End",
				trueValue: undefined,
				type: t,
				unitProperty: undefined,
				width: ""
			};
			return E;
		}
	});
});