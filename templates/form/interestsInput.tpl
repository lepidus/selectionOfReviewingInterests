{**
 * templates/user/interestsInput.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2000-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Keyword input control for user interests
 *}
<script>
    $(document).ready(function(){ldelim}
        $("#customInterests").find(".interests").tagit({ldelim}
            fieldName: 'interests[]',
            availableTags: [
                'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico',
                'Inovações em técnicas e instrumentação para campo e laboratório (e.g., hidrológicas, geoquímicas, geofísicas e matemáticas)',
                'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade',
                'Aplicações da hidrogeologia nas engenharias, geofísica, geotecnia e mineração',
                'Estado da arte e filosofia dos métodos científicos em hidrogeologia e áreas correlatas',
                'Interações entre populações e sistemas hidrogeológicos',
                'Economia dos sistemas hidrogeológicos',
                'Contribuições da hidrogeologia para a proteção ambiental e o uso sustentável dos recursos naturais',
                'Sustentabilidade e resiliência hídrica, com ênfase no papel das águas subterrâneas no enfrentamento das mudanças climáticas',
                'Águas subterrâneas na política e na governança dos recursos hídricos',
                'O papel das águas subterrâneas na agricultura e na segurança alimentar',
                'Serviços ecossistêmicos das águas subterrâneas',
                'Hidrogeologia de sistemas cársticos e meios fraturados',
                'Hidrogeologia em ambientes costeiros, no semiárido brasileiro e na Amazônia',
                'Diagnóstico, remediação e gestão de águas subterrâneas e solos contaminados',
                'Investigação, monitoramento e modelagem numérica das águas subterrâneas',
                'Geoquímica e isótopos aplicados às águas subterrâneas',
                'Águas subterrâneas no ambiente urbano e no abastecimento público',
                'Educação e conscientização sobre águas subterrâneas',
                'Recarga artificial gerenciada de aquíferos',
                'Investigação forense aplicada a estudos hidrogeológicos',
                'Aplicação de big data, softwares, sensores orbitais e inteligência artificial em estudos hidrogeológicos',
                'Cooperação internacional e gestão de aquíferos transfronteiriços',
                'História da hidrogeologia e biografias de hidrogeólogos eminentes'
            ],
            allowSpaces: true,
            autocomplete: {ldelim}
                delay: 0,
                minLength: 0 
            {rdelim},
            beforeTagAdded: function(event, ui) {ldelim}
                var availableTags = $("#customInterests").find(".interests").tagit("option", "availableTags");
                console.log("Available tags: " + availableTags);
                var tagAllowed = $.map(availableTags, function(tag) {ldelim}
                    return tag.toLowerCase();
                {rdelim}).indexOf(ui.tagLabel.toLowerCase()) !== -1;

                return tagAllowed;
            {rdelim}
        {rdelim});

        $(document).on('focus click', '.tagit-new input', function() {ldelim}
            $(this).autocomplete("search", "");
        {rdelim});
    {rdelim});
</script>

<div id="customInterests">
    <!-- The container which will be processed by tag-it.js as the interests widget -->
    <ul class="interests">
        {if $FBV_interests}{foreach from=$FBV_interests item=interest}<li class="hidden">{$interest|escape}</li>{/foreach}{/if}
    </ul>
    {if $FBV_label_content}<span>{$FBV_label_content}</span>{/if}
</div>