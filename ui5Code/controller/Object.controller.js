/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["i2d/mpe/operations/manages2/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History",
	"i2d/mpe/operations/manages2/model/formatter", "sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
	"sap/i2d/mpe/lib/popovers1/fragments/WorkCenterController", "sap/i2d/mpe/lib/commons1/utils/util", "sap/m/MessageToast",
	"sap/m/MessageBox", "sap/i2d/mpe/lib/commons1/fragments/OrderOperationStatus", "sap/i2d/mpe/lib/commons1/fragments/ApplyHoldDialog",
	"sap/i2d/mpe/lib/commons1/fragments/ReleaseHoldDialog", "sap/i2d/mpe/lib/commons1/utils/constants",
	"sap/i2d/mpe/lib/commons1/utils/formatter", "sap/i2d/mpe/lib/qmcomps1/util/Defects", "sap/i2d/mpe/lib/qmcomps1/util/Formatter",
	"sap/i2d/mpe/lib/popovers1/fragments/ProductionOrderController"
], function (B, J, H, f, M, W, r, a, b, O, A, R, c, d, D, e, P) {
	"use strict";
	return B.extend("i2d.mpe.operations.manages2.controller.Object", {
		formatter: f,
		reuseUtil: r,
		commonformatter: d,
		defectFormatter: e,
		onInit: function () {
			var o;
			var v = new J({
				busy: true,
				delay: 0
			});
			var E = sap.ui.getCore().getEventBus();
			E.subscribe("AppState", "hanldeAppstateDetailChanges", this.hanldeAppstateDetailChanges, this);
			this._oOneOperationReleaseButton = this.getView().byId("idOneOperationReleaseButton");
			this.getRouter().getRoute("object").attachPatternMatched(this._handleRouteMatched, this);
			o = this.getView().getBusyIndicatorDelay();
			this.setModel(v, "objectView");
			this._oHoldButton = this.getView().byId("idOperationHoldButton");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				v.setProperty("/delay", o);
			});
			this.oMaterialPop = new M();
			this.oWorkCenterPop = new W();
			this.oProductionOrderPop = new P();
			var g = this.getView().byId("idOpreationObjectPageLayout");
			f.setOperationDetailPageReferences(g, this);
			d.setObjectPageLayoutReference(g);
			r.setObjectPageRefrence(this);
			var h = this.getEventBusParameters();
			A.setEventBusParameters(E, h.ApplyHoldDialog.Channel, h.ApplyHoldDialog.Event);
			var i = this.getReleaseEventBusParameters();
			var E = sap.ui.getCore().getEventBus();
			var j = this.getOwnerComponent().getModel("DetailModel");
			var k = j.getData();
			if (k.bEnableAutoBinding) {
				this._bDetailsScreenInitialLoad = true;
			} else {
				this._bDetailsScreenInitialLoad = false;
			}
			var l = this.getOwnerComponent().getModel("ActionButtonVisiblity");
			if (!l) {
				if (sap.ushell && sap.ushell.Container) {
					var s = sap.ushell.Container.getService("CrossApplicationNavigation");
					var S = [];
					var m = "#ProductionOrder-change";
					S.push(m);
					var n = "#ProductionOrderConfirmation-createTimeTicket";
					S.push(n);
					s.isIntentSupported(S).done(function (C) {
						if (C) {
							var q = {
								editOrder: false,
								confirmOrder: false
							};
							q.editOrder = C["#ProductionOrder-change"].supported;
							q.confirmOrder = C["#ProductionOrderConfirmation-createTimeTicket"].supported;
							var p = {
								EditButtonVisible: q.editOrder,
								ConfirmButtonVisible: q.confirmOrder
							};
							this.getOwnerComponent().setModel(new J(p), "ActionButtonVisiblity");
						}
					}.bind(this)).fail(function () {
						var p = {
							EditButtonVisible: true,
							ConfirmButtonVisible: true
						};
						this.getOwnerComponent().setModel(new J(p), "ActionButtonVisiblity");
						jQuery.sap.log.error("Reading intent data failed.");
					}.bind(this));
				} else {
					var p = {
						EditButtonVisible: true,
						ConfirmButtonVisible: true
					};
					this.getOwnerComponent().setModel(new J(p), "ActionButtonVisiblity");
				}
			}
			this._DefectsClass = new D();
		},
		getManufaturingOrderTextInDetailsPage: function (m) {
			return this.getResourceBundle().getText("OrderNumber", [m]);
		},
		_handleRouteMatched: function (E) {
			var o = E.getParameter("arguments").operationId;
			this.iAppState = E.getParameter("arguments").iAppState;
			this.sOperationId = o;
			this.sOrderInternalBillOfOperations = this.extractNumberFromString(o.split(",")[0]);
			this.sOrderIntBillOfOperationsItem = this.extractNumberFromString(o.split(",")[1]);
			this.updateOperationDetailModel();
			this.getModel().metadataLoaded().then(function () {
				this._bindView("/" + o);
			}.bind(this));
			var s = E.getParameter("arguments").iAppState;
			var C = E.getParameter("config").name;
			this.getOwnerComponent().extractInnerAppStateFromURL(s, C, o);
		},
		onDataReceived: function (E) {
			var C = E.getParameters().getParameters().data.results;
			var h = C[0].MfgFeatureIsActiveInAnyPlant;
			if (h === "X") {
				this._oHoldButton.setVisible(true);
			} else {
				this._oHoldButton.setVisible(false);
			}
			this.setCustomFiltersData(h);
		},
		extractNumberFromString: function (s) {
			var g = /\d+/g;
			return s.match(g)[0];
		},
		_bindView: function (o) {
			var t = this;
			var v = this.getModel("objectView"),
				g = this.getModel();
			var h = this.getModel("DetailModel"),
				i = h.getData();
			g.setUseBatch(false);
			this.getView().bindElement({
				path: o,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						g.metadataLoaded().then(function () {
							v.setProperty("/busy", true);
						});
					},
					dataReceived: $.proxy(function () {
						v.setProperty("/busy", false);
						var j = this.getView().getBindingContext();
						var m = this.getView().getModel();
						var k = m.getProperty("MfgFeatureIsActiveInAnyPlant", j);
						if (i.selectedOrderData && k === undefined) {
							k = i.selectedOrderData.MfgFeatureIsActiveInAnyPlant;
						}
						var p = f.setHoldIconVisibility(k);
						if (p) {
							this._DefectsClass.setProperties(this, j);
							var l = t.getModel().getObject(t.getView().getBindingContext().getPath());
							t._DefectsClass.setFilters(l.ManufacturingOrder, l.OrderIntBillOfOperationsItem);
							t._DefectsClass.checkExistingDefects();
						}
					}, this)
				}
			});
		},
		defectsCallbackFn: function (g) {
			if (g.length > 0 && g[0].to_ShopFloorItem) {
				this._DefectsClass.setVisibleColumns(true, false);
			}
		},
		onNavToDefect: function (E) {
			this._DefectsClass.onNavToDefect(E);
		},
		_onBindingChange: function () {
			var v = this.getView();
			var V = this.getModel("objectView");
			var E = v.getElementBinding();
			V.setProperty("/busy", false);
			if (!E.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			if (this._bDetailsScreenInitialLoad === false) {
				this.rebindAllTablesOfAllBlocks();
			} else {
				this._bDetailsScreenInitialLoad = false;
			}
			this.bSecondReqToThisPage = true;
		},
		rebindAllTablesOfAllBlocks: function () {
			var o = this.getView().getBindingContext();
			var m = this.getView().getModel();
			var g = m.getProperty("MfgFeatureIsActiveInAnyPlant", o);
			var p = f.setHoldIconVisibility(g);
			this.rebindTableOfBlock("idComponentsBlock", "idAllComponentsTable");
			if (p) {
				this.rebindTableOfBlock("idActivitiesBlock", "idActivitiesSmartTable");
			}
			this.rebindTableOfBlock("idOperationsScheduleBlock", "idAllOrderScheduleTable");
			this.rebindTableOfBlock("idOperationPrgress", "idOperationInProgressTable");
			this.rebindTableOfBlock("idOperationNotStarted", "idOperationNotStartedTable");
			this.rebindTableOfBlock("idOrderConfirmationBlock", "idAllConfirmationTable");
			this.rebindTableOfBlock("idInspectionBlock", "idInspectionBlockSmartTable");
		},
		hanldeAppstateDetailChanges: function (E, o, g) {
			var m = this.getView().getModel("DetailModel");
			if (m) {
				var h = m.getData();
				h.orderId = g.orderId;
				h.sOrderInternalBillOfOperations = g.sOrderInternalBillOfOperations;
				h.sOrderIntBillOfOperationsItem = g.sOrderIntBillOfOperationsItem;
				if (g.selectedOrderData) {
					h.selectedOrderData = g.selectedOrderData;
				}
				m.setData(h);
			}
		},
		updateOperationDetailModel: function () {
			var m = this.getView().getModel("DetailModel");
			var o = m.getData();
			o.orderId = this.sOperationId;
			o.sOrderInternalBillOfOperations = this.sOrderInternalBillOfOperations;
			o.sOrderIntBillOfOperationsItem = this.sOrderIntBillOfOperationsItem;
			o.sAppId = this.iAppState;
			m.setData(o);
			var i = this.getOwnerComponent().getModel("AppState");
			var p = i.getProperty("/appState");
			p.detailPage = o;
			this.getOwnerComponent().updateAppStateFromAppStateModel();
		},
		rebindTableOfBlock: function (s, t) {
			var o = this.getView().byId(s);
			if (o) {
				var v = o.getSelectedView();
				if (v) {
					var g = sap.ui.getCore().byId(v);
					if (s === "idOrderOperationsBlock") {
						var S = g.byId("btnSegmntOrderOperation");
						S.setSelectedButton(S.getButtons()[0]);
					}
					var h = g.byId(t);
					h.rebindTable();
				}
			}
		},
		handleMaterialLinkPress: function (E) {
			var C = E.getSource().getBindingContext();
			var m = C.getModel();
			var p = m.getProperty("ProductionPlant", C);
			var s = m.getProperty("Material", C);
			this.oMaterialPop.openMaterialPopOver(E, this, s, p);
		},
		handleWorkCenterPress: function (E) {
			this.oWorkCenterPop.openWorkCenterPopOver(E, this);
		},
		handleNavOrderDetail: function (E) {
			var s = E.getSource();
			if (s.getBindingContext() !== undefined) {
				var p = s.getBindingContext().sPath;
				var o = s.getModel().getProperty(p);
				var m = o.ManufacturingOrder || o.MRPElement;
				this.oProductionOrderPop.openProdOrdPopOver(E, this, m);
				var g = f.getWordInBrackets("'" + E.getSource().getText() + "'");
				var C = sap.ushell.Container.getService("CrossApplicationNavigation");
				C.toExternal({
					target: {
						shellHash: "#ManufacturingOrderItem-manage&/ManageOrders/C_Manageorders" + g
					}
				});
			}
		},
		handleConfirmOperation: function () {
			var C = this.getView().getBindingContext().getObject();
			var m = C.ManufacturingOrder;
			var s = C.ManufacturingOrderOperation;
			var g = C.ManufacturingOrderSequence;
			r.confirmOrderOperation(m, s, g);
		},
		handleEditOperation: function () {
			var C = this.getView().getBindingContext().getObject();
			r.editOrder(C.ManufacturingOrder);
		},
		handleDisplayWorkCenterPress: function () {
			var C = this.getView().getBindingContext().getObject();
			var w = C.WorkCenterInternalID;
			var s = C.WorkCenterTypeCode;
			var p = {
				WorkCenterInternalID: w,
				WorkCenterTypeCode: s
			};
			if (w && s) {
				var g = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
				var o = g && g("CrossApplicationNavigation");
				if (o) {
					o.toExternal({
						target: {
							semanticObject: "WorkCenter",
							action: "displayFactSheet"
						},
						params: p
					});
				}
			}
		},
		handleStatusLinkPress: function (E) {
			O.openStatusPopOver(E, this);
		},
		onExit: function () {
			var E = sap.ui.getCore().getEventBus();
			E.unsubscribe("AppState", "hanldeAppstateDetailChanges", this.hanldeAppstateDetailChanges, this);
		},
		handleReleaseOperationPress: function () {
			var C = this.getView().getBindingContext().getObject();
			var o = C.OrderInternalBillOfOperations;
			var s = C.OrderIntBillOfOperationsItem;
			var S = {
				aError: [],
				aWarning: []
			};
			var l = this.getView().getModel();
			this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
			this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
			var p = {
				"method": "POST",
				"urlParameters": {
					"OrderInternalBillOfOperations": "",
					"OrderIntBillOfOperationsItem": ""
				},
				"success": function (g, h) {
					var m;
					var j;
					var k;
					var n;
					var q = JSON.parse(h.headers["sap-message"]);
					if (q.severity === "error" || q.severity === "warning") {
						if (q.severity === "error") {
							S.aError.push(q);
						} else {
							S.aWarning.push(q);
						}
					}
					for (var i = 0; i < q.details.length; i++) {
						if (q.details[i].severity === "error" || q.details[i].severity === "warning") {
							if (q.details[i].severity === "error") {
								S.aError.push(q.details[i]);
							} else {
								S.aWarning.push(q.details[i]);
							}
						}
					}
					var t, F, u, z;
					if (S.aError.length > 0) {
						if (S.aError[0].code !== "AG/024") {
							t = this.getI18NText("oneOperationReleaseRequestErrorMSG", [g.ManufacturingOrder, g.ManufacturingOrderOperation]);
							F = S.aError[0].message;
							for (z = 1; z < S.aError.length; z++) {
								F = F + "\n" + S.aError[z].message;
							}
							if (S.aWarning.length > 0) {
								for (z = 0; z < S.aWarning.length; z++) {
									F = F + "\n" + this.getI18NText("WarningInBrackets", S.aWarning[z].message);
								}
								t = this.getI18NText("operationReleaseErrorAndWarningMSG", [S.aError.length, S.aWarning.length]);
							}
							u = !!this.getView().$().closest(".sapUiSizeCompact").length;
							this.getDynamicMessageBox(t, b.Icon.ERROR, this.getI18NText("ErrorPopupTitle"), [b.Action.CLOSE], "ErrorOrderMSG", F, u);
						} else if (S.aError[0].code === "AG/024") {
							b.warning(S.aError[0].message, {
								styleClass: u ? "sapUiSizeCompact" : ""
							});
						}
					} else if (S.aWarning.length > 0) {
						t = this.getI18NText("oneOperationReleaseWarningMSG", [g.ManufacturingOrder, g.ManufacturingOrderOperation]);
						F = S.aWarning[0].message;
						for (z = 1; z < S.aWarning.length; z++) {
							F = F + "\n" + S.aWarning[z].message;
						}
						u = !!this.getView().$().closest(".sapUiSizeCompact").length;
						this.getDynamicMessageBox(t, b.Icon.WARNING, this.getI18NText("WarningPopupTitle"), [b.Action.CLOSE], "WarningOrderMSG", F, u);
						this._oOneOperationReleaseButton.setEnabled(false);
						this.rebindAllTablesOfAllBlocks();
						m = this.oIssuesBlock.getModel("DetailModel");
						j = m.getData();
						j.bReleasedSuccess = true;
						this.oIssuesBlock.sOrderId = j.orderId;
						k = this.oIssuesBlock.oParentBlock.getModel();
						n = this.oIssuesBlock.oParentBlock.getModel().oData[this.oIssuesBlock.sOrderId];
						f.handleIsuesValue(k, n, this.oIssuesBlock);
						m.setData(j);
					} else {
						t = this.getI18NText("oneOperationReleasedSuccessMSG", [g.ManufacturingOrder, g.ManufacturingOrderOperation]);
						a.show(t, {
							duration: 5000
						});
						this._oOneOperationReleaseButton.setEnabled(false);
						this.rebindAllTablesOfAllBlocks();
						m = this.oIssuesBlock.getModel("DetailModel");
						j = m.getData();
						j.bReleasedSuccess = true;
						this.oIssuesBlock.sOrderId = j.orderId;
						k = this.oIssuesBlock.oParentBlock.getModel();
						n = this.oIssuesBlock.oParentBlock.getModel().oData[this.oIssuesBlock.sOrderId];
						f.handleIsuesValue(k, n, this.oIssuesBlock);
						m.setData(j);
					}
				}.bind(this),
				"error": function (E) {
					a.show(this.getI18NText("ReleaseFailed"));
					this._oOneOperationReleaseButton.setEnabled(false);
				}
			};
			p.urlParameters.OrderInternalBillOfOperations = o;
			p.urlParameters.OrderIntBillOfOperationsItem = s;
			l.callFunction("/C_ManageoperationsReleaseoperation", p);
		},
		handleOperationHoldButton: function (E) {
			var C = E.getSource().getBindingContext();
			var m = C.getModel();
			var o = m.getProperty("ManufacturingOrder", C);
			var s = m.getProperty("OrderInternalBillOfOperations", C);
			var g = m.getProperty("OrderIntBillOfOperationsItem", C);
			var p = m.getProperty("ProductionPlant", C);
			var h = m.getProperty("Material", C);
			var w = m.getProperty("WorkCenter", C);
			this.oIssuesBlock = this.byId("idIssuesBlock-Collapsed");
			this.oIssuesBlock.oParentBlock = this.getView().byId("idIssuesSubSection");
			var i = {
				ManufacturingOrder: o,
				ProductionPlant: p,
				Material: h,
				OrderInternalID: s,
				OrderOperationInternalID: g,
				WorkCenter: w
			};
			var j = [c.HOLD.TYPE_OPERATION, c.HOLD.TYPE_ORDER, c.HOLD.TYPE_MATERIAL, c.HOLD.TYPE_WORKCENTER];
			A.initAndOpen(i, this.getModel("HoldModel"), j, undefined, [c.HOLD.TYPE_OPERATION], true);
		},
		getEventBusParameters: function () {
			var E = {
				ApplyHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages2",
					Event: "onHoldSuccessfullyApplied",
					Callback: this.onHoldSuccessfullyComplete
				}
			};
			return E;
		},
		getReleaseEventBusParameters: function () {
			var E = {
				ReleaseHoldDialog: {
					Channel: "sap.i2d.mpe.operations.manages2",
					Event: "onHoldSuccessfullyApplied",
					Callback: this.onReleaseHoldSuccessfullyComplete
				}
			};
			return E;
		},
		onHoldSuccessfullyComplete: function (C, E, o) {
			var m, F;
			if (o.success) {
				this.rebindAllTablesOfAllBlocks();
				if (o.info) {
					m = o.info;
					a.show(m);
				}
			} else {
				var g = !!this.getView().$().closest(".sapUiSizeCompact").length;
				m = o.info;
				this.getDynamicMessageBox(m, b.Icon.ERROR, "Error", [b.Action.CLOSE], "ErrorOrderMSG", F, g);
			}
		},
		onReleaseHoldSuccessfullyComplete: function (C, E, o) {
			if (o.success) {
				this.rebindAllTablesOfAllBlocks();
			}
		},
		getDynamicMessageBox: function (m, i, s, g, h, F, C) {
			b.show(m, {
				icon: i ? i : b.Icon.NONE,
				title: s ? s : "",
				actions: g ? g : b.Action.OK,
				id: h ? h : "DefaultMessageBoxId",
				details: F ? F : "Error",
				styleClass: C ? "sapUiSizeCompact" : ""
			});
		},
		getI18NText: function (i, v) {
			return this.getResourceBundle().getText(i, v);
		}
	});
});