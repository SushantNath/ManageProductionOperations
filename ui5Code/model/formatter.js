/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/Time", "sap/ui/core/format/DateFormat", "sap/ui/core/format/NumberFormat"], function (T, D, N) {
	"use strict";
	return {
		numberUnit: function (v) {
			if (!v) {
				return "";
			}
			return parseFloat(v);
		},
		formatDateTimeUTC: function (d) {
			var n = D.getDateTimeInstance({
				pattern: "EEE, MMM d",
				UTC: true
			}).format(d);
			return n;
		},
		removeField: function (f) {
			if (!f) {
				return false;
			}
		},
		setHoldIconVisibility: function (M) {
			if (M === "X" || M === true) {
				return true;
			} else {
				return false;
			}
		},
		getWordInBrackets: function (t) {
			if (t) {
				return "(" + t + ")";
			}
		},
		removeLeadingZeros: function (m) {
			m = m.replace(/^0+/, '');
			return m;
		},
		DatePriority: function (s, a) {
			var d;
			if (a) {
				d = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "EEE, MMM d",
					UTC: true
				});
				return d.format(new Date(a));
			} else {
				d = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "EEE, MMM d",
					UTC: true
				});
				return d.format(new Date(s));
			}
		},
		TimePriority: function (s, a, S, A) {
			var t = null;
			var b = null;
			if (a) {
				t = new T({
					style: 'short',
					relativeScale: 'auto',
					UTC: true
				});
				b = t.formatValue(A, "string");
				return b;
			} else {
				t = new T({
					style: 'short',
					relativeScale: 'auto',
					UTC: true
				});
				b = t.formatValue(S, "string");
				return b;
			}
		},
		textBasedonDate: function (s, a) {
			var r = this.formatter.textCodeBasedonDate(s, a);
			var R = this.getModel("i18n").getProperty(r);
			return this.getModel("i18n").getResourceBundle().getText("LABEL_WITH_COLON", [R]);
		},
		textCodeBasedonDate: function (s, a) {
			if (a) {
				return "Actual";
			} else {
				return "Scheduled";
			}
		},
		iconBasedonDate: function (s, a) {
			if (a) {
				return false;
			} else {
				return true;
			}
		},
		setOperationDetailPageReferences: function (o, O) {
			this.oObjectPageLayoutinstance = o;
			this.oObjcetPageController = O;
		},
		getObjectPageLayoutReference: function () {
			return this.oObjectPageLayoutinstance;
		},
		getObjectPageControllerReference: function () {
			return this.oObjcetPageController;
		},
		finalConfirmation: function (f) {
			var F = this.formatter.finalConfirmationText(f);
			return this.getI18NCommonText(F);
		},
		finalConfirmationText: function (f) {
			if (f === "X") {
				return "Yes";
			} else {
				return "No";
			}
		},
		setProgressIndicatorState: function (O, a) {
			if (O || a) {
				return "Warning";
			} else {
				return "Success";
			}
		},
		percentValue: function (ConfirmedYieldQty, PlannedTotalQty) {
			var result;
			if (PlannedTotalQty > 0) {
				result = (ConfirmedYieldQty / PlannedTotalQty) * 100;
				if (result > 100) result = 100;
			}
			return result;
		},
		setEnableStatus: function (s, o) {
			if (o === 'X') {
				return false;
			}
			if (s === 3 || s === 4 || s === "03" || s === "04") {
				return true;
			} else {
				return false;
			}
		},
		setOperationHoldIssueIconColor: function (O) {
			if (O) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		setOperationIsConfirmedText: function (O) {
			if (O) {
				var o = this.getI18NText("operationIsConfirmed");
				return o;
			} else {
				var s = this.getI18NText("operationIsNotConfirmed");
				return s;
			}
		},
		setDelayIconColor: function (O, a) {
			if (a || O) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		setMissingQuantityIconColor: function (O) {
			if (O < 0) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		setMissingComponentIconColor: function (O) {
			if (O) {
				return "Negative";
			} else {
				return "Default";
			}
		},
		setMissingQualityIssueIconColor: function (o, i, I, s) {
			if (o === "X" || i === "X" || I === "X" || s === "X") {
				return "Negative";
			} else {
				return "Default";
			}
		},
		getStatusText: function (s) {
			var S = this.formatter.getStatusTextCode(s);
			return this.getI18NText(S);
		},
		getStatusTextCode: function (s) {
			if (s === "01") {
				return "status_created";
			} else if (s === "02") {
				return "status_scheduled";
			} else if (s === "03") {
				return "status_released";
			} else if (s === "04") {
				return "status_partConfirmed";
			} else if (s === "05") {
				return "status_confirmed";
			} else if (s === "06") {
				return "status_partdelivered";
			} else if (s === "07") {
				return "status_delivered";
			} else if (s === "08") {
				return "status_techCompleted";
			} else if (s === "09") {
				return "status_closed";
			} else if (s === "10") {
				return "status_deleted";
			}
		},
		setPercentValue: function (p) {
			return parseInt(p);
		},
		getCombineDescriptionWithId: function (d, i) {
			if (i && !d) {
				return i;
			} else if (d && i) {
				return d + " (" + i + ")";
			} else if (d && !i) {
				return d;
			}
		},
		getOperationLinkText: function (o, O) {
			var s;
			if (O) {
				s = this.getI18NText("OperationsPopoverLink", [O, o]);
			} else {
				s = o;
			}
			return s;
		},
		addColon: function (t) {
			var l;
			if (t) {
				l = this.getModel("i18n").getResourceBundle().getText("LABEL_WITH_COLON", [t]);
			} else {
				l = '';
			}
			return l;
		},
		setEnableStatusRelease: function (s) {
			if (s === "01" || s === "02") {
				return true;
			} else {
				return false;
			}
		},
		setEnableHoldButton: function (m, M, s) {
			if (m === "EPO" && M === "X") {
				if (s === "05" || s === "07" || s === "08" || s === "09" || s === "10") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},
		getHoldButtonStatus: function (p) {
			if (p.ManufacturingFeature === "EPO" && p.ManufacturingFeatureIsActive === "X" && p.OrderIsShopFloorOrder) {
				if (p.OperationIsConfirmed === "X" || p.OperationIsDelivered === "X" || p.OperationIsClosed === "X" || p.OperationIsTechlyCompleted ===
					"X" || p.OperationIsDeleted === "X") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},
		isOperationChangePossible: function (p) {
			if (p.ManufacturingFeature === "EPO" && p.ManufacturingFeatureIsActive === "X" && p.OrderIsShopFloorOrder) {
				if (p.OperationIsConfirmed === "X" || p.OperationIsDelivered === "X" || p.OperationIsClosed === "X" || p.OperationIsTechlyCompleted ===
					"X" || p.OperationIsDeleted === "X" || p.OperationIsPartiallyConfirmed === "X") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},
		progressDisplayValue: function (A, a) {
			var d;
			if (!this.getI18NText) {
				d = this.getView().getModel("i18n").getResourceBundle().getText("ProgressText", [A, a]);
			} else {
				d = this.getI18NText("ProgressText", [A, a]);
			}
			return d;
		},
		activityProgressDisplayValue: function (C, O, P) {
			var d;
			if (!this.getI18NText) {
				d = this.getView().getModel("i18n").getResourceBundle().getText("ActivitiesProgressText", [C, parseFloat(C) + parseFloat(O), P]);
			} else {
				d = this.getI18NText("ActivitiesProgressText", [C, parseFloat(C) + parseFloat(O), P]);
			}
			return d;
		},
		setActivityProgressPercentValue: function (C, O) {
			return 100 * parseFloat(C) / (parseFloat(C) + parseFloat(O));
		},
		formatTextWithBrackets: function (v, V) {
			var r = this.getView().getModel("i18n").getResourceBundle();
			if (V && V !== "") {
				return r.getText("TUPEL_WITH_BRACKETS", [v, V]);
			} else {
				return v;
			}
		},
		formatQtyWithUnit: function (q, u) {
			var r = this.getView().getModel("i18n").getResourceBundle();
			var o = parseFloat(q);
			if (!q && q !== 0) {
				return "";
			} else if (u) {
				return r.getText("TUPEL_WITH_BLANK", [o, u]);
			} else {
				return o;
			}
		},
		formatIconColor: function (c) {
			switch (c) {
			case 0:
				return "Neutral";
			case 1:
				return "Negative";
			case 2:
				return "Critical";
			case 3:
				return "Positive";
			default:
				return "";
			}
		},
		getScanStatusText: function (c, b) {
			var r = this.getView().getModel("i18n").getResourceBundle();
			if (!b) {
				switch (c) {
				case 0:
					return r.getText("scanStatusGrey");
				case 1:
					return r.getText("scanStatusRed");
				case 2:
					return r.getText("scanStatusYellow");
				case 3:
					return r.getText("scanStatusGreen");
				default:
					return "";
				}
			} else {
				return "";
			}
		},
		formatSerialNrStatus: function (s) {
			var m = this.getModel();
			var b = m.oData;
			return b[s[0]].SASStatusName;
		},
		getFeatureAvailability: function (M) {
			if (M === "X" || M === true) {
				return true;
			} else {
				return false;
			}
		},
		getURLForDocument: function (d) {
			return "/sap/opu/odata/sap/CV_ATTACHMENT_SRV/OriginalContentSet(" + "Documenttype='" + d.Documenttype + "'," + "Documentnumber='" + d
				.Documentnumber + "'," + "Documentpart='" + d.Documentpart + "'," + "Documentversion='" + d.Documentversion + "'," +
				"ApplicationId='" + d.ApplicationId + "'," + "FileId='" + d.FileId + "')/$value";
		}
	};
});