/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/uxap/BlockBase"],
	function (BlockBase) {
		"use strict";

		return BlockBase.extend("i2d.mpe.operations.manages1.blocks.IssuesBlock", {
			metadata: {
				views: {
					Collapsed: {
						viewName: "i2d.mpe.operations.manages1.blocks.IssuesBlock",
						type: "XML"
					},
					Expanded: {
						viewName: "i2d.mpe.operations.manages1.blocks.IssuesBlock",
						type: "XML"
					}
				}
			}
		});
	});