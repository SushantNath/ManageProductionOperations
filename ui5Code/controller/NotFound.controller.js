/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["i2d/mpe/operations/manages2/controller/BaseController"],function(B){"use strict";return B.extend("i2d.mpe.operations.manages2.controller.NotFound",{onLinkPressed:function(){var a=this.getRouter().oHashChanger.getHash().split("/sap-iapp-state=")[1];this.getRouter().navTo("catchAll",{iAppState:a},true);}});});
