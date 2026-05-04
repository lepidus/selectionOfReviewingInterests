(function() {
	if (!window.pkp || !pkp.Vue || pkp.Vue.options.components['reviewer-interest-filter']) {
		return;
	}

	pkp.Vue.component('reviewer-interest-filter', {
		props: {
			groupTitle: {
				type: String,
				default: ''
			},
			isFilterActive: {
				type: Boolean,
				default: false
			},
			param: {
				type: String,
				required: true
			},
			showGroupTitle: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				required: true
			},
			value: {
				type: [String, Number, Boolean, Array, Object],
				required: true
			}
		},
		methods: {
			toggle: function() {
				if (this.isFilterActive) {
					this.$emit('remove-filter', this.param, this.value);
				} else {
					this.$emit('add-filter', this.param, this.value);
				}
			}
		},
		render: function(createElement) {
			return createElement(
				'div',
				{},
				[
					this.showGroupTitle
						? createElement(
								'div',
								{
									class: 'pkpHeader',
									style: {
										padding: '0.75rem 1rem 0.25rem 1rem'
									}
								},
								[
									createElement(
										'span',
										{
											class: 'pkpHeader__title',
											style: {
												color: '#000000D6'
											}
										},
										[
											createElement(
												'h3',
												{
													style: {
														color: '#000000D6',
														fontSize: '14px',
														fontWeight: '700',
														lineHeight: '1.35'
													}
												},
												this.groupTitle
											)
										]
									)
								]
						  )
						: null,
					createElement(
						'div',
						{
							class: 'pkpFilter'
						},
						[
							createElement(
								'label',
								{
									style: {
										display: 'flex',
										alignItems: 'center',
										padding: '0.35rem 1rem',
										cursor: 'pointer',
										color: '#006798',
										fontSize: '14px',
										fontWeight: '400',
										lineHeight: '1.35',
										textAlign: 'left'
									}
								},
								[
									createElement('input', {
										attrs: {
											type: 'checkbox'
										},
										domProps: {
											checked: this.isFilterActive
										},
										style: {
											flexShrink: '0'
										},
										on: {
											change: function() {
												this.toggle();
											}.bind(this)
										}
									}),
									createElement(
										'span',
										{
											style: {
												marginLeft: '0.5rem',
												color: '#006798',
												fontWeight: '400',
												fontSize: '14px',
												wordBreak: 'normal',
												overflowWrap: 'normal',
												whiteSpace: 'normal'
											}
										},
										this.title
									)
								]
							)
						]
					)
				].filter(Boolean)
			);
		}
	});
})();
