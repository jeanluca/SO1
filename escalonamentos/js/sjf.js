var time            = 0; // Tempo geral do processador
var process         = new Array(9); // Array de processos 
var processOriginal = new Array(9); // Array de processos original

var startTime, stopTime; // Marca o tempo para o usuário escalonar

/**
 * Função principal, chamada quando a página já estiver pronta (carregada)
 */
$(document).ready(function() {
    
    readyList();
    processSize();
    
    fancyboxVideo();
    fancyboxExplanation();
    
    reset();
    
});

/**
 * Faz com que a lista de prontos se torne "sortable" 
 */
function readyList(){
    $('#ready').sortable({
        containment : '#draggable-area',
        placeholder : 'place',
        stop        : checkOrder
    });
}

/**
 * Verifica se a fila de prontos está ordenada
 */
function checkOrder(){
    var i = 0;
    var ordered = 0;
    
    $('#ready li').each(function(){
        if($(this).html() == process[i]){
            ordered ++;
        }
        i++;
    });
    
    if(ordered == 9){
        $('#ready').sortable('disable');
        
        processor();
        orderedReadyList();
        
        messageStatus('Todos os processos foram ordenados, voce já pode começar a escalonar!');

    }
    
}

/**
 * Inicializa os processos com números aleatórios e define os tamanhos
 */
function processSize(){
    var i = 0;
    var size;
    
    $('#ready li').each(function(){
        size = parseInt((Math.random() * 15 ) + 1);
        
        // Seta largura do processo para o tamanho gerado * 5px
        $(this).width((size * 5) + 'px');
        // Coloca no html a duração do processo
        $(this).html(size);
        
        // Lista de processos originais para ser usada quando os processos forem concluídos
        processOriginal[i] = size;
        process[i++] = size;
    });
    
    // Ordena a lista de processos utilizando a função mySort
    process.sort(mySort);
}

/**
 * Função que ordena os processos
 */
function mySort(a, b){
    return (a - b);
}

/**
 * Faz com que o processador se torne "droppable", capaz de receber
 * os processos arrastados da lista de prontos
 */
function processor() {
    $('#processor').droppable({
        
        drop: readyToProcessor
        
    });
}

/**
 * Função que move o processo da lista de prontos para o processador
 */
function readyToProcessor( event, ui ) {
    
    var draggable       = ui.draggable;
    
    var nextProcess     = $('#ready').find('li').attr('id');
    var selectedProcess = ui.draggable.attr('id');
    var inProcessor     = $('#processor').find('li').html();
    
    var timeToSchedule;
    
    // Se o processador estiver vazio
    if (inProcessor == null) {
        
        // Se o processo selecionado é o próximo processo
        if (nextProcess == selectedProcess) {
            
            // Calcula o tempo que o usuário demorou para escalonar
            stopTime = $.now();
            timeToSchedule = Math.ceil((stopTime - startTime) / 1000) + "ms";
    
            // Faz com que este processo não seja mais "draggable" (arrastável)
            ui.draggable.draggable('disable');

            // Desabilita a opção que permite que o processo retorne
            ui.draggable.draggable('option', 'revert', false);

            // Posiciona o processo dentro do processador
            ui.draggable.position({
                of: $(this), 
                my: 'left top', 
                at: 'left top'
            });

            // Busca o elemento físico na lista de prontos
            var html = $('#ready').find('li').html();

            // Remove o elemento físico da lista de prontos
            $('#' + selectedProcess).remove();

            // Adiciona fisicamente o processo no processador (html)
            $('#processor ul').append('<li id="' + selectedProcess + '">' + html + '</li>');

            messageStatus("Você demorou " + timeToSchedule + " para escalonar. Executando processo " + selectedProcess.toUpperCase() + "...");
            
            // Começa a contar o tempo
            clock();

            // Habilita a função para mover do processador para a fila de prontos
            processorToFinished();

        } else {

            messageStatus("Este não é o próximo processo a ser executado.");

        }
        
    } else {
        
        // ID do processo que se encontra no processador
        var processID = $('#processor').find('li').attr('id');
        
        if ($('#processor').find('li').hasClass('done')) {
            
            // Processador está com um processo mas o quantum já acabou
            messageStatus("Primeiro retire o processo " + processID.toUpperCase() + " do processador.");
            
        } else {

            // Processador está com um processo que ainda está em execução
            messageStatus("Processador já está executando um processo (" + processID.toUpperCase() + ").");
         
        }
        
    }
    
}

/**
 * Depois que a lista foi ordenada habilita que os processos sejam "draggable"
 */
function orderedReadyList() {
    $('.draggable').draggable({
        
        containment: '#draggable-area',
        revert: true,
        start: function() {
            
            startTime = $.now();
            
            // Muda a cor do processador para receber o processo
            $('#processor ul').animate({
                backgroundColor: '#FFFFFF'
            });
            
        },
        stop: function() {
            
            // Retorna a cor do processador para a normal
            $('#processor ul').animate({
                backgroundColor: '#CDCDCD'
            });
            
        }
        
    });
}

/**
 * Exibe a mesagem passada como parâmetro na barra de mensagens
 */
function messageStatus(text) {
    
    $('#message').html(text);
    
}

/**
 * Habilita a opção de clicar no processo que está dentro do processador
 * para enviá-lo para a fila de concluídos
 */
function processorToFinished() {
    
    $('#processor li').click(function() {
        
        var selectedProcess = $(this).attr('id');
        var html            = $(this).html();
        
        // Se o processo já está executou seu quantum
        if ($(this).hasClass('done')) {
        
            // Remove o processo fisicamente do processador
            $(this).remove();         
                
            /**
             * Processo já concluiu tudo o que tinha para executar,
             * é colocado então na fila de concluídos
             */                
            $('#finished').append('<li id="' + selectedProcess + '"  class="inactive">' + selectedProcess.toUpperCase() + '</li>');
                
            var index   = parseInt(selectedProcess[1]);
            var largura = processOriginal[index - 1];
            
            $('#' + selectedProcess).width((largura * 5)+ 'px');              
          
            messageStatus("Processador está livre para execução.");
            
            /**
             * Chama a função para preparar a fila de prontos novamente
             * para não haver problemas quando a fila ficar vazia 
             */
            readyList();
            
        }
        
        // Retorna a cor do processador para a normal
        $('#processor ul').animate({
            backgroundColor: '#CDCDCD'
        });
        
        checkGameOver();
        
    });
    
}


/**
 * Função recursiva que altera o tempo do processo e do processador
 */
function clock() {
    
    var processID       = $('#processor').find('li').attr('id');
    var remainingTime   = $('#processor').find('li').html();

    if (remainingTime > 0) {
        
        time++;
        remainingTime--;
        
        // Atualiza o tempo do processador com o tempo de execução
        $('#processor').find('span').html(time + "ms");
        
        // Atualiza o tempo do processo com o tempo restante de execução
        $('#processor').find('li').html(remainingTime);
        
        // Chama recursivamente a função do relógio daqui a 1s
        setTimeout(clock, 1000);
        
    } else {         

        $('#processor').find('li').addClass('done');
        
        // Processo já terminou tudo o que tinha para executar
        $('#processor').find('li').addClass('complete');
        
        messageStatus("Acabou o quantum atribuído ao processo " + processID.toUpperCase() + ".");
             
    }
         
}

/**
 * Abre o fancybox com o vídeo de exemplo da aplicação ao clicar no menu "Vídeo"
 */
function fancyboxVideo() {
    $("#app-menu-video").click(function() {
        $.fancybox({
            'padding'               : 0,
            'autoScale'             : false,
            'transitionIn'          : 'none',
            'transitionOut'         : 'none',
            'width'                 : 680,
            'height'                : 495,
            'href'                  : 'http://player.vimeo.com/video/44179711',
            'type'                  : 'iframe'
        });

        return false;
    });
}

/**
 * Abre a exmplicação da aplicação ao clicar no menu "Explicação"
 */
function fancyboxExplanation(){
    $("#app-menu-explanation").fancybox({
        type:"iframe"
    });
}

/**
 * Verifica se terminou tudo, se sim exibe a janela com fim de jogo
 */
function checkGameOver() {
    if ($('#finished li').length == 9) {
        
        $('#game-over').fancybox({
            'height'    : 415,
            'width'     : 415,
            'type'      : 'iframe'
        }).click();
        
    }
}

/*
 * Força o reset
 */
function forceReset() {
    messageStatus("Reiniciando assim que o processador estiver livre.");
    $("*").css("cursor", "progress");
    $('#app-menu-reset').click();
}

/*
 * Aguarda o processador terminar para resetar
 */
function reset() {
    $('#app-menu-reset').click(function(event) {
        
        event.preventDefault();
        
        // Verifica se o processador está executando
        if ($('#processor li').length > 0) {
            setTimeout(forceReset, 1000);
        } else {
        
            // Reseta as variáveis
            time = 0;
            processTime = 0;
            process = new Array(9); 
            processOriginal = new Array(9);
            
            // Limpa a lista de prontos
            $('#ready li').each(function () {
                $(this).remove();
            });

            // Limpa a lista de concluídos
            $('#finished li').each(function () {
                $(this).remove();
            });

            // Limpa o processador
            $('#processor li').each(function () {
                $(this).remove();
            });
            
            // Reseta o tempo do processador
            $('#processor').find('span').html("0ms");
            
            $('*').css('cursor', 'auto');
            $('#app-menu li span').css('cursor', 'pointer');
            $('#app-menu a').css('cursor', 'pointer');
            
            createProcess();
            
            messageStatus("Processador está livre para execução.");
            
        }
        
    });
}

/*
 * Cria 9 processos novos quando a função Reset() é chamada
 */
function createProcess(){
    // Cria 9 processos 
    for (i = 1; i <= 9; i++) {
        $('#ready').append("<li id='p" + i + "' class='draggable'></li>");                   
    }    
    processSize(); 
}