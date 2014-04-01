AUI().use(
	'aui-base',
	'aui-io-plugin-deprecated',
	function(A) {
		Liferay.namespace('Notifications');

		var dockbarUserNotificationsList = A.one('.dockbar-user-notifications .user-notifications-list');

		var userNotificationsList = A.one('.user-notifications-list-container .user-notifications-list');

		Liferay.Notifications = {
			createMarkAllAsReadNode: function(nodeHTML) {

				var markAsAllReadNode = A.Node.create(nodeHTML);

				var replaceNode = function(node, id) {
					var placeholderNode = node.one(id);

					if (placeholderNode) {
						placeholderNode.placeAfter(markAsAllReadNode);
						placeholderNode.remove();
					}
				}

				if (userNotificationsList) {
					replaceNode(userNotificationsList, '.fullViewMarkAllAsRead');
				}

				if (dockbarUserNotificationsList) {
					replaceNode(dockbarUserNotificationsList, '.dropDownMarkAllAsRead');
				}
			},

			delegateNotifications: function(dockbarUri, fullviewUri, notificationsCountUri) {
				var instance = this;

				if (dockbarUserNotificationsList && !userNotificationsList) {
					instance._getDelegation(dockbarUserNotificationsList, dockbarUri, null, false, notificationsCountUri, '.user-notification .btn-action');
					instance._getDelegation(dockbarUserNotificationsList, dockbarUri, null, true, notificationsCountUri, '.dismiss-notifications');
				}

				if (!dockbarUserNotificationsList && userNotificationsList) {
					instance._getDelegation(userNotificationsList, null, fullviewUri, false, notificationsCountUri, '.user-notification .btn-action');
					instance._getDelegation(userNotificationsList, null, fullviewUri, true, notificationsCountUri, '.dismiss-notifications');
				}

				if (dockbarUserNotificationsList && userNotificationsList) {
					instance._getDelegation(dockbarUserNotificationsList, dockbarUri, fullviewUri, false, notificationsCountUri, '.user-notification .btn-action');
					instance._getDelegation(dockbarUserNotificationsList, dockbarUri, fullviewUri, true, notificationsCountUri, '.dismiss-notifications');

					instance._getDelegation(userNotificationsList, dockbarUri, fullviewUri, false, notificationsCountUri, '.user-notification .btn-action');
					instance._getDelegation(userNotificationsList, dockbarUri, fullviewUri, true, notificationsCountUri, '.dismiss-notifications');
				}
			},

			viewNotification: function(event) {
				var instance = this;

				var currentTarget = event.currentTarget;

				var openDialog = currentTarget.attr('data-openDialog');

				var uri = currentTarget.attr('data-href');

				if (uri) {
					var markAsReadURL = currentTarget.attr('data-markAsReadURL');

					if (markAsReadURL) {
						A.io.request(
							markAsReadURL,
							{
								after: {
									success: function(event, id, obj) {
										var responseData = this.get('responseData');

										if (responseData.success) {
											var userNotification = currentTarget.ancestor('.user-notification');

											if (userNotification) {
												userNotification.removeClass('unread');

												var read = userNotification.one('.content .read');

												if (read) {
													read.setHTML(Liferay.Language.get('read'));
												}

												instance._redirect(uri, openDialog);
											}
										}
									}
								},
								dataType: 'json'
							}
						);
					}
					else {
						var userNotification = currentTarget.ancestor('.user-notification');

						if (userNotification) {
							instance._redirect(uri, openDialog);
						}
					}
				}
			},

			_dismissNotifications: function(event, dockbarUri, fullviewUri, markAllAsRead, notificationsCountUri) {
				var instance = this;

				event.preventDefault();

				var currentRow;

				var loadingRow = A.Node.create('<div class="loading-animation"></div>');

				if (!markAllAsRead) {
					currentRow = event.currentTarget.ancestor('.user-notification');
					currentRow.hide().placeAfter(loadingRow);
				}

				A.io.request(
					event.currentTarget.attr('href'),
					{
						after: {
							success: function(event) {
								var response = this.get('responseData');

								if (response.success) {
									instance._getNotificationsCount(event, currentRow, dockbarUri, loadingRow, fullviewUri, markAllAsRead, notificationsCountUri);
								}
							}
						},
						dataType: 'json'
					}
				);
			},

			_getDelegation: function(notificationsList, dockbarUri, fullviewUri, markAllAsRead, notificationsCountUri, selector) {
				var instance = this;

				notificationsList.delegate(
					'click',
					function(event) {
						instance._dismissNotifications(event, dockbarUri, fullviewUri, markAllAsRead, notificationsCountUri);
					},
					selector
				);
			},

			_getNotificationsCount: function(event, currentRow, dockbarUri, loadingRow, fullviewUri, markAllAsRead, notificationsCountUri) {
				var instance = this;

				event.preventDefault();

				A.io.request(
					notificationsCountUri,
					{
						on: {
							success: function(event) {
								var response = this.get('responseData');

								if (response.success) {
									instance._updateNotificationsCount(response["newUserNotificationsCount"], response["unreadUserNotificationsCount"]);

									if (!markAllAsRead) {
										loadingRow.remove();
										currentRow.remove();
									}

									if (userNotificationsList) {
										instance._refreshNotificationsResult(userNotificationsList, fullviewUri);
									}

									if (dockbarUserNotificationsList) {
										instance._refreshNotificationsResult(dockbarUserNotificationsList, dockbarUri);
									}
								}
							}
						},
						dataType: 'json'
					}
				);
			},

			_redirect: function(uri, openDialog) {
				if (openDialog === "false") {
					var topWindow = Liferay.Util.getTop();

					topWindow.location.href = uri;
				}
				else {
					Liferay.Util.openWindow(
						{
							id: 'notificationsWindow',
							uri: uri
						}
					);
				}
			},

			_refreshNotificationsResult: function(notificationsList, uri) {
				if (notificationsList) {
					if (!notificationsList.io) {
						notificationsList.plug(
							A.Plugin.IO,
							{
								autoLoad: false
							}
						);
					}

					notificationsList.io.set('uri', uri);
					notificationsList.io.start();
				}
			},

			_updateNotificationsCount: function(newUserNotificationsCount, unreadUserNotificationsCount) {
				var dockbarUserNotifications = A.one('.dockbar-user-notifications');

				if (dockbarUserNotifications) {
					var dockbarUserNotificationsCount = dockbarUserNotifications.one('.user-notifications-count');

					if (dockbarUserNotificationsCount) {
						dockbarUserNotificationsCount.toggleClass('alert', (newUserNotificationsCount > 0));

						dockbarUserNotificationsCount.setHTML(unreadUserNotificationsCount);
					}
				}

				var sidebarUserNotifications = A.one('.user-notifications-sidebar');

				if (sidebarUserNotifications) {
					var sidebarUnreadCount = sidebarUserNotifications.one('.count');

					if (sidebarUnreadCount) {
						sidebarUnreadCount.setHTML(unreadUserNotificationsCount);
					}
				}
			},
		};
	}
);