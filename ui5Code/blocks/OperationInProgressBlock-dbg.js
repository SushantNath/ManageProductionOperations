/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/uxap/BlockBase'],
	function(BlockBase) {
		"use strict";

		var OperationInProgressBlock = BlockBase.extend("i2d.mpe.operations.manages2.blocks.OperationInProgressBlock", {
			metadata: {
				views: {
					Collapsed: {
						viewName: "i2d.mpe.operations.manages2.blocks.OperationInProgressBlock",
						type: "XML"
					},
					Expanded: {
						viewName: "i2d.mpe.operations.manages2.blocks.OperationInProgressBlock",
						type: "XML"
					}
				}
			}
		});

		return OperationInProgressBlock;

	});