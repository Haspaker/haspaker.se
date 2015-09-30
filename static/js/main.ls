window <<< require 'prelude-ls'

class Page extends Backbone.Model

	view: PageView

	defaults:
		active: false

	activate: -> @set \active, true
	deactivate: -> @set \active, false

class PageView extends Backbone.View

	initialize: ->
		@listenTo @model, 'change:active', @show_hide
		@show_hide!

	show_hide: ->
		if @model.get \active => @show!
		else => @hide!

	show: -> @$el.delay(500).fadeIn()

	hide: -> 

		#with @$el
		#	..animate top: ..offset().top + ..height(), 300, ~>
		#		..css top: 0
		#		..hide!

		@$el.stop().hide!


class AboutPageView extends PageView

	el: \section.about

	initialize: ->
		@nameView = new NameView model: @model
		super ...

class ContactPageView extends PageView

	el: \section.contact

class ProjectsPageView extends PageView

	el: \section.projects

	show: -> 
		$('.main-content').addClass \covered
		@prepare_slide_in_projects!
		setTimeout @slide_in_projects, 1000

	hide: -> 
		$('.main-content').removeClass \covered
		@$el.hide!

	prepare_slide_in_projects: ~>
		@$el.show!
		$(\.project).each ->
			length_to_slide = $(window).width() - this.getBoundingClientRect().left
			$(this).css left: length_to_slide

	slide_in_projects: ~>
		$(\.project).each (i) ->
			$(this).delay(500*i).animate left: 0, 1000, \easeOutBack

class SkillsPageView extends PageView

	el: \section.skills

	initialize: ->
		super ...

	show: -> 
		$('.main-content').addClass \covered
		@$el.delay(500).fadeIn() # Pass 0s duration to make delayable animation

	hide: -> 
		$('.main-content').removeClass \covered
		@$el.hide!


class Navigation extends Backbone.Model

	defaults:
		page_index: 0

	pages: 
		* Page
		* Page
		* Page
		* Page

	hashlinks:
		about: 0
		projects: 1
		skills: 2
		contact: 3

	initialize: ->

		@pages |>= map (new)

		@hashlink!
		@change_page!

		window.onhashchange = @hashlink

		@on 'change:page_index', @change_page

	change_page: ->
		index = @get \page_index
		@pages.map -> it.deactivate!
		@pages[index].activate!

	hashlink: ~>
		hash = tail location.hash
		if hash in keys @hashlinks
			@set \page_index, @hashlinks[hash]





class NavigationView extends Backbone.View

	el: \.navigation

	events:
		'click .pages div': (e) -> @select_page $(e.target).index()

	pages:
		* AboutPageView
		* ProjectsPageView
		* SkillsPageView
		* ContactPageView

	initialize: ->

		for page_model, i in @model.pages
			@pages[i] = new @pages[i] model: page_model

		page_index = @model.get \page_index
		@pages[ page_index ].$el.show!

		@listenTo @model, 'change:page_index', @move_arrow
		@listenTo @model, 'change:page_index', @render
		$(window).resize @position_arrow
		@position_arrow!

		@render!

	get_selected_page_label: ->
		page_index = @model.get \page_index
		label_index = page_index + 1
		@$(".page-label:nth-child(#label_index)")

	render: ->
		@$(\.page-label).removeClass \selected
		@get_selected_page_label().addClass \selected

	position_arrow: ~>

		$selected_page_label = @get_selected_page_label()

		with $selected_page_label[0].getBoundingClientRect()
			@$( \.arrow ).css top: ..top + 5
			@$( \.arrow ).css left: ..right + 10

	move_arrow: ->

		$selected_page_label = @get_selected_page_label()

		with $selected_page_label[0].getBoundingClientRect()
			@$( \.arrow ).stop().animate ( top: ..top + 5, left: ..right + 10 ),
				1500,
				\easeOutElastic

	select_page: (index) -> @model.set \page_index, index


class SiteView extends Backbone.View

	initialize: ->

		is_safari = navigator.userAgent.indexOf('Safari') isnt -1 and navigator.userAgent.indexOf('Chrome') is -1

		if not is_safari
			$(window).scroll @keep_edge_fixed
			$(window).resize @keep_edge_fixed

	keep_edge_fixed: ->
		with $(window) =>
			$('.edge .ribbon').css height: ..height(), top: ..scrollTop()		



class NameView extends Backbone.View

	el: \.full-name

	frames: 30
	current_frame: 1

	animation_time: 2000ms
	animation_delay: 1500ms

	loaded_frames: 0
	init_time: Date.now()

	interval: null

	initialize: ->

		@preload_images!

		setTimeout @start_animation, @animation_delay

		@listenTo @model, 'change:active', ~> if @model.get(\active) => @restart_animation!

	frame_url: (frame) -> "/img/swirl/frame-#frame.png"

	set_frame: (frame) -> 
		@current_frame = frame
		$('.swirl img').attr src: @frame_url frame

	next_frame: ~>
		if @current_frame < @frames
			@set_frame @current_frame + 1

	start_animation: ~>
		if Date.now() - @init_time < @animation_delay => return
		if @loaded_frames isnt @frames => return
		if @current_frame isnt 1 => return
		@interval = setInterval @next_frame, @animation_time / @frames

	restart_animation: ~>
		@set_frame 1
		clearInterval @interval
		setTimeout @start_animation, @animation_delay

	preload_images: ~>
		window.preloaded_name_imgs = []
		for frame_index from 1 to @frames => let frame_index
			img = window.preloaded_name_imgs[ frame_index ] = new Image()
			img.onload = if ++@loaded_frames is @frames then @start_animation!
			img.src = @frame_url frame_index




$ ->

	window.navigation = new Navigation()
	navigationView = new NavigationView model: navigation
	siteView = new SiteView()
