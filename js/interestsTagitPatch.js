/* global jQuery */

(function($) {
	if (!$.fn.tagit || $.fn.tagit.soriPatched) {
		return;
	}

	var originalTagit = $.fn.tagit;

	var updateAutocompleteWidth = function(el) {
		var $field = $(el);
		var $widget = $field
			.find('.tagit-new input[type="text"]')
			.autocomplete('widget');
		var fieldOffset = $field.offset();

		$widget
			.addClass('sori-interests-autocomplete')
			.css({
				'width': $field.outerWidth() + 'px',
				'max-width': 'none',
				'box-sizing': 'border-box',
				'left': fieldOffset.left + 'px'
			});
	};

	var updateInterestsUi = function(el, placeholder) {
		var $field = $(el);
		var assignedTags = originalTagit.call(el, 'assignedTags') || [];
		var isEmpty = assignedTags.length === 0;
		var $input = $field.find('.tagit-new input[type="text"]');

		$field.addClass('sori-interests-selectLike');
		$field.toggleClass('sori-interests-empty', isEmpty);
		$input.attr('placeholder', isEmpty ? placeholder : '');
	};

	var closeAutocomplete = function(el) {
		var $input = $(el).find('.tagit-new input[type="text"]');
		if ($input.data('ui-autocomplete') || $input.data('autocomplete')) {
			$input.autocomplete('close');
		}
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

	var soriTagit = function(method) {
		if (typeof method !== 'string'
				&& $(this).hasClass('interests')
				&& !$(this).data('soriReinit')) {
			var ns = $.pkp && $.pkp.plugins
				&& $.pkp.plugins.generic
				&& $.pkp.plugins.generic.selectionOfReviewingInterests;
			if (ns && ns.interestsOptions) {
				var el = this;
				var placeholder = ns.placeholder || 'Select one or more options';
				var baseOptions = method || {};
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
						delay: 0,
						minLength: 0,
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
						if (!ui.duringInitialization) {
							closeAutocomplete(el);
						}
						updateInterestsUi(el, placeholder);
						if (typeof originalAfterTagAdded === 'function') {
							originalAfterTagAdded.call(this, event, ui);
						}
					},
					afterTagRemoved: function(event, ui) {
						closeAutocomplete(el);
						updateInterestsUi(el, placeholder);
						if (typeof originalAfterTagRemoved === 'function') {
							originalAfterTagRemoved.call(this, event, ui);
						}
					}
				});
				var result = originalTagit.call(this, configuredOptions);
				var $input = $(this).find('.tagit-new input[type="text"]');

				updateInterestsUi(el, placeholder);
				$input
					.off('autocompleteopen.sori autocompleteclose.sori click.sori')
					.on('autocompleteopen.sori', function() {
						updateAutocompleteWidth(el);
						bindAutocompleteScrollClose(el);
					})
					.on('autocompleteclose.sori', function() {
						unbindAutocompleteScrollClose(el);
					})
					.on('click.sori', function() {
						$(this).autocomplete('search', '');
					});
				$(this).data('soriReinit', true);

				return result;
			}
		}

		return originalTagit.apply(this, arguments);
	};

	soriTagit.soriPatched = true;
	soriTagit.soriOriginal = originalTagit;
	$.fn.tagit = soriTagit;
})(jQuery);
