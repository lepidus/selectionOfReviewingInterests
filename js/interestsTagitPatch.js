(function($) {
	if (!$.fn.tagit) {
		return;
	}

	var originalTagit = $.fn.tagit;
	var interestsWrapperMaxWidth = '595.4px';

	if (originalTagit.soriInterestsPatched) {
		return;
	}

	var getInterestsWrapper = function(el) {
		return $(el).closest('#userExtras #interests');
	};

	var applyInterestsWrapperWidth = function(el) {
		var $wrapper = getInterestsWrapper(el);

		if (!$wrapper.length) {
			return;
		}

		$wrapper.css({
			'box-sizing': 'border-box',
			'width': '100%',
			'max-width': interestsWrapperMaxWidth,
			'min-width': '0',
			'position': 'relative',
			'overflow': 'visible'
		});
	};

	var updateAutocompletePosition = function(el) {
		var $field = $(el);
		var $wrapper = getInterestsWrapper(el);
		var $widget = $field
			.find('.tagit-new input[type="text"]')
			.autocomplete('widget');
		var position = $wrapper.length ? $field.position() : $field.offset();

		$widget
			.addClass('sori-interests-autocomplete')
			.css({
				'position': 'absolute',
				'width': $field.outerWidth() + 'px',
				'max-width': 'none',
				'box-sizing': 'border-box',
				'left': position.left + 'px',
				'top': (position.top + $field.outerHeight()) + 'px'
			});
	};

	var updateInterestsUi = function(el, placeholder) {
		var $field = $(el);
		var assignedTags = originalTagit.call(el, 'assignedTags') || [];
		var isEmpty = assignedTags.length === 0;
		var $input = $field.find('.tagit-new input[type="text"]');

		applyInterestsWrapperWidth(el);
		$field.addClass('sori-interests-selectLike');
		$field.toggleClass('sori-interests-empty', isEmpty);
		$input.attr('placeholder', isEmpty ? placeholder : '');
	};

	var unbindAutocompleteScrollClose = function(el) {
		var handlers = $(el).data('soriAutocompleteCloseHandlers');

		if (!handlers) {
			return;
		}

		if (document.removeEventListener) {
			document.removeEventListener('wheel', handlers.close, true);
			document.removeEventListener('mousewheel', handlers.close, true);
			document.removeEventListener('DOMMouseScroll', handlers.close, true);
			document.removeEventListener('scroll', handlers.close, true);
		}
		if (window.removeEventListener) {
			window.removeEventListener('resize', handlers.close, true);
		}

		$(el).removeData('soriAutocompleteCloseHandlers');
	};

	var bindAutocompleteScrollClose = function(el) {
		var $field = $(el);
		var $input = $field.find('.tagit-new input[type="text"]');
		var closeOnExternalMovement = function(event) {
			var $widget = $input.autocomplete('widget');
			var target = event.target;

			if ($widget.length
					&& (target === $widget[0] || $.contains($widget[0], target))) {
				return;
			}

			$input.autocomplete('close');
			unbindAutocompleteScrollClose(el);
		};

		unbindAutocompleteScrollClose(el);

		if (document.addEventListener) {
			document.addEventListener('wheel', closeOnExternalMovement, true);
			document.addEventListener('mousewheel', closeOnExternalMovement, true);
			document.addEventListener('DOMMouseScroll', closeOnExternalMovement, true);
			document.addEventListener('scroll', closeOnExternalMovement, true);
		}
		if (window.addEventListener) {
			window.addEventListener('resize', closeOnExternalMovement, true);
		}

		$field.data('soriAutocompleteCloseHandlers', {
			close: closeOnExternalMovement
		});
	};

	var getInterestsNamespace = function() {
		return $.pkp && $.pkp.plugins
			&& $.pkp.plugins.generic
			&& $.pkp.plugins.generic.selectionOfReviewingInterests;
	};

	var bindInterestsUi = function(el, placeholder) {
		var $input = $(el).find('.tagit-new input[type="text"]');

		updateInterestsUi(el, placeholder);
		$input
			.off('autocompleteopen.sori autocompleteclose.sori click.sori')
			.on('autocompleteopen.sori', function() {
				updateAutocompletePosition(el);
				bindAutocompleteScrollClose(el);
			})
			.on('autocompleteclose.sori', function() {
				unbindAutocompleteScrollClose(el);
			})
			.on('click.sori', function() {
				$(this).autocomplete('search', '');
			});
		$(el).data('soriReinit', true);
	};

	var patchedTagit = function(method) {
		if (typeof method !== 'string'
				&& $(this).hasClass('interests')
				&& !$(this).data('soriReinit')) {
			var ns = getInterestsNamespace();
			if (ns && ns.interestsOptions) {
				var el = this;
				var placeholder = ns.placeholder || 'Selecione uma ou mais opcoes';
				var baseOptions = method || {};
				var $interestsWrapper = getInterestsWrapper(el);
				var preExistingTagsLower = $.map($(this).children('li:not(.tagit-new)'), function(tag) {
					return $.trim($(tag).text()).toLowerCase();
				});
				var originalBeforeTagAdded = baseOptions.beforeTagAdded;
				var originalAfterTagAdded = baseOptions.afterTagAdded;
				var originalAfterTagRemoved = baseOptions.afterTagRemoved;
				var configuredOptions = $.extend(true, {}, baseOptions, {
					fieldName: 'interests[]',
					allowSpaces: true,
					showAutocompleteOnFocus: true,
					autocomplete: $.extend({}, baseOptions.autocomplete || {}, {
						appendTo: $interestsWrapper.length ? $interestsWrapper : 'body',
						delay: 0,
						minLength: 0,
						position: {
							my: 'left top',
							at: 'left bottom',
							of: $(el),
							collision: 'none'
						},
						source: function(search, showChoices) {
							var filter = search.term.toLowerCase();
							var choices = $.grep(ns.interestsOptions, function(option) {
								return option.toLowerCase().indexOf(filter) === 0;
							});
							if (!this.options.allowDuplicates) {
								choices = this._subtractArray(choices, this.assignedTags());
							}
							showChoices(choices);
						}
					}),
					beforeTagAdded: function(event, ui) {
						var tagLower = ui.tagLabel.toLowerCase();
						var normalizedAllowedList = $.map(ns.interestsOptions, function(tag) {
							return tag.toLowerCase();
						});
						var inAllowedList = normalizedAllowedList.indexOf(tagLower) !== -1;
						var isPreExisting = preExistingTagsLower.indexOf(tagLower) !== -1;

						if (!inAllowedList && !isPreExisting) {
							return false;
						}

						if (typeof originalBeforeTagAdded === 'function') {
							return originalBeforeTagAdded.call(this, event, ui);
						}
					},
					afterTagAdded: function(event, ui) {
						$(el).find('.tagit-new input[type="text"]').autocomplete();
						updateInterestsUi(el, placeholder);
						if (typeof originalAfterTagAdded === 'function') {
							originalAfterTagAdded.call(this, event, ui);
						}
					},
					afterTagRemoved: function(event, ui) {
						$(el).find('.tagit-new input[type="text"]').autocomplete();
						updateInterestsUi(el, placeholder);
						if (typeof originalAfterTagRemoved === 'function') {
							originalAfterTagRemoved.call(this, event, ui);
						}
					}
				});
				var result = originalTagit.call(this, configuredOptions);

				bindInterestsUi(el, placeholder);

				return result;
			}
		}

		return originalTagit.apply(this, arguments);
	};

	patchedTagit.soriInterestsPatched = true;
	$.fn.tagit = patchedTagit;

	$(function() {
		var ns = getInterestsNamespace();
		if (!ns || !ns.interestsOptions) {
			return;
		}

		$('.interests.tagit').each(function() {
			var $field = $(this);
			if ($field.data('soriReinit')) {
				return;
			}

			try {
				originalTagit.call($field, 'destroy');
			} catch (e) {
				return;
			}

			$field.tagit({
				fieldName: 'interests[]',
				allowSpaces: true
			});
		});
	});
})(jQuery);
