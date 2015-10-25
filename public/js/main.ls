window <<< require 'prelude-ls'

class Page extends Backbone.Model

	title: null

	view: PageView

	defaults:
		active: false

	activate: -> @set \active, true
	deactivate: -> @set \active, false

class PageView extends Backbone.View

	initialize: ->
		@listenTo @model, 'change:active', @show_hide
		@listenTo @model, 'change:active', @set_title
		if @model.get \active => @show!

	show_hide: ->
		if @model.get \active => @show!
		else => @hide!

	show: -> @$el.fadeIn()

	hide: ->  @$el.stop().hide!

	set_title: ~>
		if @title and @model.get \active => 
			document.title = @title


class LandingPageView extends PageView

	el: \section.landing

	title: "Hannes Aspåker"

	events: ->
		'click .view-portfolio': @scroll_to_portfolio
		'click .go-back': @hide_portfolio

	initialize: -> 

		super ...

		# Friendly alert to the user if s/he tries to activate the portfolio link in the navbar
		$('.page-label.selected').click ~>
			with @$('.view-portfolio .alert')
				..removeClass \pulse
				setTimeout (-> ..addClass \pulse), 5

		@resize_greeting!
		$(window).resize @resize_greeting

	resize_greeting: ~>
		$greeting = @$ \.greeting
		$greeting.css height: \auto
		height = Math.max  $greeting.height(), $(window).height() - $greeting.offset().top
		$greeting.css height: height
		if window.location.hash == \#portfolio
			$(window).scrollTo  @$(\.portfolio)

	show: ->

		with window.navigation
			# Don't animate if website just loaded the front page
			if ..previous("page_index") is 0 => @$el.show!
			else super ...
		if window.location.hash is \#portfolio => @scroll_to_portfolio!

	scroll_to_portfolio: ->
		$(window).scrollTo  @$(\.portfolio), 500, -> 
			window.location.hash = \#portfolio

	hide_portfolio: ->
		$(window).scrollTo 0, 500, -> 
			window.location.hash = \#

class SkillsPageView extends PageView

	el: \section.skills

	title: "Hannes Aspåker | Skills"

class Navigation extends Backbone.Model

	defaults:
		page_index: 0

	pages: 
		* Page
		* Page

	hashlinks:
		'': 0
		'portfolio': 0
		'skills': 1

	initialize: ->

		@pages |>= map (new)

		@hashlink!
		@change_page!

		window.onhashchange = @hashlink

		@on 'change:page_index', @change_page
		@on 'change:page_index', @update_hash

	change_page: ->
		index = @get \page_index
		@pages.map -> it.deactivate!
		@pages[index].activate!

	hashlink: ~>
		hash = if location.hash is /^#/ then tail location.hash else ''
		if hash in keys @hashlinks
			@set \page_index, @hashlinks[hash]

	update_hash: ~>
		index = @get \page_index
		window.location.hash = (keys @hashlinks)[ elem-index index, (values @hashlinks) ]


class NavigationView extends Backbone.View

	el: \.navigation

	events:
		'click .pages .page-label': (e) -> @select_page $(e.target).index()

	pages:
		* LandingPageView
		* SkillsPageView

	initialize: ->

		for page_model, i in @model.pages
			@pages[i] = new @pages[i] model: page_model

		page_index = @model.get \page_index

		@listenTo @model, 'change:page_index', @move_arrow
		@listenTo @model, 'change:page_index', @render

		@render!

	get_selected_page_label: ->
		page_index = @model.get \page_index
		label_index = page_index + 1
		@$(".page-label:nth-child(#label_index)")

	render: ->
		@$(\.page-label).removeClass \selected
		@get_selected_page_label().addClass \selected

	select_page: (index) -> @model.set \page_index, index

class Site extends Backbone.Model

class SiteView extends Backbone.View


$ ->

	window.site = new Site()
	window.navigation = new Navigation()
	siteView = new SiteView model: window.site
	navigationView = new NavigationView model: window.navigation
