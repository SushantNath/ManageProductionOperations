/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/Device", "i2d/mpe/operations/manages1/model/models",
	"i2d/mpe/operations/manages1/controller/ErrorHandler", "sap/ui/core/routing/HashChanger"
], function (U, D, m, E, H) {
	"use strict";
	return U.extend("i2d.mpe.operations.manages1.Component", {
		metadata: {
			manifest: "json"
		},
		init: function () {
			U.prototype.init.apply(this, arguments);
			this._oErrorHandler = new E(this);
			this.setModel(m.createDeviceModel(), "device");
			this.setModel(m.createFLPModel(), "FLP");
			this.intializeAppState();
			this.setOperationDetailModel();
			this.bInitialRefreshLoadAppstate = true;
			this._oRouter = this.getRouter();
			this.oHashChanger = H.getInstance();
			var p = this.oHashChanger.getHash();
			if (p) {
				if (p.indexOf("sap-iapp-state") > -1) {
					this.sOldAppStateKey = p.split("sap-iapp-state=")[1];
					this._extractInnerAppStateFromKey(this.sOldAppStateKey);
				} else {
					this.sOldAppStateKey = this.getInnerAppStateKey();
					this.bInitialRefreshLoadAppstate = false;
				}
				if (p.indexOf("C_Manageoperations") > -1 && p.indexOf("sap-iapp-state") > -1) {
					this._oRouter.initialize("true");
					this.addAppStateKey("object", p.split("/")[1]);
				} else if (p.indexOf("C_Manageoperations") === -1 && p.indexOf("sap-iapp-state") > -1) {
					this._oRouter.initialize("true");
					this.addAppStateKey("worklist");
				} else {
					this._oRouter.initialize();
				}
			} else {
				this.sOldAppStateKey = this.getInnerAppStateKey();
				this.bInitialRefreshLoadAppstate = false;
				this._oRouter.initialize("true");
				this.addAppStateKey("worklist");
			}
		},
		_crossAppNavToDetail: function (v, r, o, h) {
			var u;
			if (v === "worklist") {
				u = r.getURL("worklist", {
					iAppState: this.getInnerAppStateKey()
				});
			} else {
				u = r.getURL("object", {
					operationId: o,
					iAppState: this.getInnerAppStateKey()
				});
			}
			if (u) {
				h.replaceHash(u);
			}
		},
		setOperationDetailModel: function () {
			var o = new sap.ui.model.json.JSONModel({});
			var O = o.getData();
			O.bEnableAutoBinding = true;
			o.setData(O);
			this.setModel(o, "DetailModel");
		},
		intializeAppState: function () {
			var c = this,
				C = sap.ushell.Container.getService("CrossApplicationNavigation");
			this.oCrossAppStatePromise = new jQuery.Deferred();
			this.oInnerAppStatePromise = new jQuery.Deferred();
			this.oAppStateModel = new sap.ui.model.json.JSONModel({
				appState: {
					variantId: "",
					VariantState: ""
				}
			});
			this.setModel(this.oAppStateModel, "AppState");
			this.oNavTargetsModel = new sap.ui.model.json.JSONModel({
				toOurAppWithState: "",
				toOurAppNoState: ""
			});
			this.setModel(this.oNavTargetsModel, "navTargets");
			this.oAppState = C.createEmptyAppState(this);
			this.calculateCrossAppLinks();
			C.getStartupAppState(this).done(function (s) {
				c.updateModelFromAppstate(c.oAppStateModel, s);
				c.oCrossAppStatePromise.resolve();
			});
			this.oInnerAppStatePromise.done(function () {
				c.updateAppStateFromAppStateModel();
			});
		},
		extractInnerAppStateFromURL: function (i, c, p) {
			var t = this;
			var l = i;
			if (this.bInitialRefreshLoadAppstate) {
				l = this.sOldAppStateKey;
				this.bInitialRefreshLoadAppstate = false;
			}
			if (l === this.getInnerAppStateKey()) {
				this.oInnerAppStatePromise.resolve();
				return;
			}
			t.createANewAppStateModel();
			this.oCrossAppStatePromise.done(function () {
				sap.ushell.Container.getService("CrossApplicationNavigation").getAppState(t, l).done(function (s) {
					t.updateModelFromAppstate(t.oAppStateModel, s);
					t.oInnerAppStatePromise.resolve();
				});
			});
			t.oInnerAppStatePromise.done(function () {
				setTimeout(function () {
					t.addAppStateKey(c, p);
				}, 0);
			});
		},
		_extractInnerAppStateFromKey: function (i) {
			var t = this;
			sap.ushell.Container.getService("CrossApplicationNavigation").getAppState(t, i).done(function (s) {
				var d = t.getModel("DetailModel");
				if (s.getData()) {
					d.setData(s.getData());
				}
			});
		},
		createANewAppStateModel: function () {
			this.oAppState = sap.ushell.Container.getService("CrossApplicationNavigation").createEmptyAppState(this);
			this.calculateCrossAppLinks();
		},
		getInnerAppStateKey: function () {
			return (this.oAppState && this.oAppState.getKey()) || " key not set yet ";
		},
		updateModelFromAppstate: function (M, a) {
			var A = a.getData();
			if (A) {
				var p = this.getRouter().oHashChanger.getHash();
				if (p.indexOf("C_Manageoperations") > -1) {
					sap.ui.getCore().getEventBus().publish("AppState", "hanldeAppstateDetailChanges", A.detailPage);
				} else {
					sap.ui.getCore().getEventBus().publish("AppState", "handleAppstateChanges", A);
				}
				return true;
			}
			return false;
		},
		updateAppStateFromAppStateModel: function () {
			var d;
			d = this.oAppStateModel.getProperty("/appState");
			this.oAppState.setData(d);
			this.oAppState.save();
		},
		calculateCrossAppLinks: function () {
			var h, c = sap.ushell.Container.getService("CrossApplicationNavigation");
			h = c.hrefForExternal({
				target: {
					semanticObject: "ManufacturingOrderOperation",
					action: "manage"
				},
				params: {
					"VariantName": "One"
				},
				appStateKey: this.oAppState.getKey()
			}, this) || "";
			this.oNavTargetsModel.setProperty("/toOurAppWithState", h);
			h = c.hrefForExternal({
				target: {
					semanticObject: "ManufacturingOrderOperation",
					action: "manage"
				},
				params: {
					"VarianName": "two"
				}
			}) || "";
			this.oNavTargetsModel.setProperty("/toOurAppNoState", h);
		},
		addAppStateKey: function (c, p) {
			if (this._oRouter) {
				if (c === "worklist") {
					this._oRouter.navTo(c, {
						iAppState: this.getInnerAppStateKey()
					}, true);
				} else {
					this._oRouter.navTo(c, {
						operationId: p,
						iAppState: this.getInnerAppStateKey()
					}, true);
				}
			}
		},
		destroy: function () {
			this._oErrorHandler.destroy();
			U.prototype.destroy.apply(this, arguments);
		},
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!D.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});