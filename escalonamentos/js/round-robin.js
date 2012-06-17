var time            = 0; // Tempo geral do processador
var processTime     = 0; // Tempo que o processo ficou executando
var canTickTock     = true;
var graphProcess    = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'];

var startTime, stopTime; // Marca o tempo para o usu�rio escalonar

var nextToBeAdded   = 1;

/**
 * Fun��o principal, chamada quando a p�gina j� estiver pronta (carregada)
 */
$(document).ready(function() {
    
    // Habilita o input do quantum
    $('#quantum').removeAttr("disabled");
    
    generateProcessorTime();
    readyList();
    processor();
    
    fancyboxExplanation();
    fancyboxVideo();
    
    addProcess();

    reset();

});

/**
 * Gera tempos aleat�rios para os processos na fila de prontos 
 * e atualiza os gr�ficos para os valores corretos
 */
function generateProcessorTime() {
    var i = 0, time;
    var tempos = new Array(8);
    
    //Gera tempos aleatorios para os procesos
    $('#ready li').each(function() {
        
        time = parseInt((Math.random() * 15) + 1);
        $(this).html(time);
        tempos[i++] = time;
        
    });

    // Seta o a largura do gr�fico do processo conforme o tempo gerado acima
    for (i = 0; i < 8; i++) {
   
        $('#' + graphProcess[i]).width((tempos[i] * 10) + 'px');
        $('#' + graphProcess[i]).parent().width((tempos[i] * 10) + 'px');
       
    }
}

/**
 * Fun��o recursiva que altera o tempo do processo, do processador e o gr�fico
 */
function clock(executeUpTo) {
    
    var processID       = $('#processor').find('li').attr('id');
    var remainingTime   = $('#processor').find('li').html();
    var quantum         = $('#quantum').val();   
    
    if ((processTime % executeUpTo != 0 || canTickTock) && remainingTime > 0) {
        
        /* Faz o rel�gio andar o tempo equivalente a um quantum 
         * ou at� finalizar tudo (0)
         */
        
        // Desabilita o poder mover o tempo (s� para o primeiro deve estar habilitado)
        canTickTock = false;
        
        time++;
        processTime++;
        remainingTime--;
        
        // Atualiza o tempo do processador com o tempo de execu��o
        $('#processor').find('span').html(time + "ms");
        
        // Atualiza o tempo do processo com o tempo restante de execu��o
        $('#processor').find('li').html(remainingTime);
        
        // Diminui a barra do gr�fico relativo ao processo
        var tam, index = processID[1] - 1;
        
        tam = $('#' + graphProcess[index]).width();
        tam = (tam - 10) + 'px';
        
        $('#' + graphProcess[index]).animate({
            width: tam
        });

        // Chama recursivamente a fun��o do rel�gio daqui a 1s
        setTimeout(clock, 1000, executeUpTo);
        
    } else {
         
        // Se for menor que o tempo do quantum, processo foi bloqueado
        if (executeUpTo < quantum && remainingTime != 0) {
             
            processTime = 0;
        
            messageStatus("O processo " + processID.toUpperCase() + " foi bloqueado por E/S.");
            
            var processo    = $('#processor').find('li').attr('id');
            var html        = $('#processor').find('li').html();
            var delay       = parseInt((Math.random() * 15) + 1) * 3000;
            
            // Adiciona fisicamente o processo ao pool de bloqueados
            $('#blocked').append('<li id="' + processo + '" class="inactive">' + html + '</li>');
            
            // Remove o processo do processador
            $('#processor').find('li').remove();
            
            // Retorna a cor do processador para a normal
            $('#processor ul').animate({
                backgroundColor: '#CDCDCD'
            }, 1000);
            
            // Habilita o input do quantum
            $('#quantum').attr("disabled","");
            
            // Tempo para ser desbloqueado, at� que a E/S esteja dispon�vel
            setTimeout(blockedToRead, delay, processo);
             
        } else {
             
            processTime = 0;
         
            $('#processor').find('li').addClass('done');
        
            // Processo j� terminou tudo o que tinha para executar
            if (remainingTime == 0) {
                $('#processor').find('li').addClass('complete');
            }
        
            messageStatus("Acabou o quantum atribu�do ao processo " + processID.toUpperCase() + ".");
             
        }
         
    }
}

/**
 * Faz com que a lista de prontos se torne "draggable"
 */
function readyList() {
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
 * Faz com que o processador de torne "droppable", capaz de receber
 * os processos arastados da lista de prontos
 */
function processor() {
    $('#processor').droppable({
        
        drop: readyToProcessor
        
    });
}

/**
 * Fun��o que move o processo da lista de prontos para o processador
 */
function readyToProcessor( event, ui ) {
    
    var draggable       = ui.draggable;
    
    var nextProcess     = $('#ready').find('li').attr('id');
    var selectedProcess = ui.draggable.attr('id');
    var inProcessor     = $('#processor').find('li').html();
    
    var timeToSchedule;
    
    // Se o processador estiver vazio
    if (inProcessor == null) {
        
        // Se o processo selecionado � o pr�ximo processo
        if (nextProcess == selectedProcess) {
            
            // Calcula o tempo que o usu�rio demorou para escalonar
            stopTime = $.now();
            timeToSchedule = Math.ceil((stopTime - startTime) / 1000) + "ms";

            // Desabibita o input do quantum, para n�o ocorrer problemas
            $('#quantum').attr("disabled","disabled");

            // Faz com que este processo n�o seja mais "draggable" (arrast�vel)
            ui.draggable.draggable('disable');

            // Desabilita a op��o que permite que o processo retorne
            ui.draggable.draggable('option', 'revert', false);

            // Posiciona o processo dentro do processador
            ui.draggable.position({
                of: $(this), 
                my: 'left top', 
                at: 'left top'
            });

            // Busca o elemento f�sico na lista de prontos
            var html = $('#ready').find('li').html();

            // Remove o elemento f�sico da lista de prontos
            $('#' + selectedProcess).remove();

            // Adiciona fisicamente o processo no processador (html)
            $('#processor ul').append('<li id="' + selectedProcess + '">' + html + '</li>');

            messageStatus("Voc� demorou " + timeToSchedule + " para escalonar. Executando processo " + selectedProcess.toUpperCase() + "...");

            // Vari�vel que controla se pode iniciar o rel�gio
            canTickTock = true;
            
            /**
             * Verifica se tem que executar at� o final do quantum
             * ou se o processo vai ser bloqueado, se for bloqueado
             * ele vai executar at� o tempo aleat�rio gerado
             */
            var quantum         = $('#quantum').val();
            var randomToBlock   = parseInt((Math.random() * 15) + 1); // Tempo rand�mico para bloquear se for necess�rio
            var executeUpTo;
            
            if (randomToBlock > quantum) {
                
                // Executa este processo at� ser preemptado
                executeUpTo = quantum;
                
            } else {
                
                // Executa este processo at� ser bloqueado
                executeUpTo = randomToBlock; 
                
            }
            
            // Come�a a contar o tempo
            clock(executeUpTo);

            // Habilita a fun��o para mover do processador para a fila de prontos
            processorToReady();

        } else {

            messageStatus("Este n�o � o pr�ximo processo a ser executado.");

        }
        
    } else {
        
        // ID do processo que se encontra no processador
        var processID = $('#processor').find('li').attr('id');
        
        if ($('#processor').find('li').hasClass('done')) {
            
            // Processador est� com um processo mas o quantum j� acabou
            messageStatus("Primeiro retire o processo " + processID.toUpperCase() + " do processador.");
            
        } else {

            // Processador est� com um processo que ainda est� em execu��o
            messageStatus("Processador j� est� executando um processo (" + processID.toUpperCase() + ").");
         
        }
        
    }
    
}

/**
 * Habilita a op��o de clicar no processo que est� dentro do processador
 * para envi�-lo de volta para a fila de prontos ou para a fila de conclu�dos
 */
function processorToReady() {
    
    $('#processor li').click(function() {
        
        var selectedProcess = $(this).attr('id');
        var html            = $(this).html();
        
        // Se o processo j� est� executou seu quantum
        if ($(this).hasClass('done')) {
        
            // Remove o processo fisicamente do processador
            $(this).remove();
            
            if (!$(this).hasClass('complete')) {

                /* Processo s� foi preemptado, n�o terminou todo o seu tempo,
                 * volta ent�o para a fila de prontos
                 */
                $('#ready').append('<li id="' + selectedProcess + '"  class="draggable">' + html + '</li>');
                
            } else {
                
                /* Processo j� concluiu tudo o que tinha para executar,
                 * � colocado ent�o na fila de conclu�dos
                 */                
                $('#finished').append('<li id="' + selectedProcess + '"  class="inactive">' + selectedProcess.toUpperCase() + '</li>');
                
            }

            messageStatus("Processador est� livre para execu��o.");

            // Habilita o input do quantum
            $('#quantum').attr("disabled","");

            /* Chama a fun��o para preparar a fila de prontos novamente
             * para n�o haver problemas quando a fila ficar vazia e posteriormente
             * um novo processo desbloqueado for adicionado
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

/* Percorre todos os processos no pool de bloqueados at� encontrar o
 * que deve voltar para a fila de prontos, movendo-o
 */
function blockedToRead(processo) {    
    $('#blocked li').each(function() {
        
        // Se � o processo correto move para a fila de prontos
        if ($(this).attr('id') == processo) {
            
            var html = $(this).html();
            
            // Remove fisicamente o processo (html)
            $(this).remove();

            // Adiciona o html do processo na lista de prontos
            $('#ready').append('<li id="' + processo + '" class="draggable">' + html + '</li>');
            
            /* Chama a fun��o para preparar a fila de prontos novamente
             * para n�o haver problemas quando a fila ficar vazia e posteriormente
             * um novo processo desbloqueado for adicionado
             */
            readyList();
            
        }
        
    });    
}

/**
 * Exibe a mesagem passada como par�metro na barra de mensagens
 */
function messageStatus(text) {
    
    $('#message').html(text);
    
}

/**
 * Valida o quantum digitado no input, para permitir apenas n�meros
 */
function validateQuantum(field) {
    var regExpr = new RegExp("^[0-9]+$");
    
    if (!regExpr.test(field.value)) {
        
        field.value = "10";
        
    }
}

/**
 * Abre o fancybox com o v�deo de exemplo da aplica��o ao clicar no menu "V�deo"
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
            'href'                  : 'http://player.vimeo.com/video/44180229',
            'type'                  : 'iframe'
        });

        return false;
    });
}

/**
 * Abre a exmplica��o da aplica��o ao clicar no menu "Explica��o"
 */
function fancyboxExplanation() {    
    $('#app-menu-explanation').fancybox({
        'type'      : 'iframe'
    });
}

/**
 * Adiciona novos processos
 */
function addProcess() {
    $('#add-process').click(function(event){
        
        event.preventDefault();
        
        // Gera um tempo aleat�rio para o processo
        var time = parseInt((Math.random() * 15) + 1);
        
        if (nextToBeAdded < 9) {
            
            // Adiciona o novo processo na lista de prontos
            $('#ready').append('<li id="p' + nextToBeAdded + '" class="draggable">' + time + '</li>');
            
            // Anima o gr�fico para a largura equivalente ao tempo
            $('#' + graphProcess[nextToBeAdded - 1]).animate({
                width: (time * 10) + 'px'
            });
            
            // Anima o gr�fico para a largura equivalente ao tempo
            $('#' + graphProcess[nextToBeAdded - 1]).parent().animate({
                width: (time * 10) + 'px'
            });
            
            nextToBeAdded++;
    
            readyList();
            
        } else {
            
            messageStatus("N�o � poss�vel criar mais de 8 processos!");
            
        }
        
    });
}

/**
 * Verifica se terminou tudo, se sim exibe a janela com fim de jogo
 */
function checkGameOver() {
    if ($('#finished li').length == 8) {
        
        // Se finalizou chama fancybox com mensagem de fim de jogo
        $('#game-over').fancybox({
            'height'    : 415,
            'width'     : 415,
            'type'      : 'iframe'
        }).click();
        
    }
}

/**
 * Forca o reset
 */
function forceReset() {
    
    $("*").css("cursor", "progress");
    
    messageStatus("Reiniciando assim que o processador estiver livre.");
    
    // For�a o click para reiniciar
    $('#app-menu-reset').click();
    
}

/**
 * Aguarda o processador terminar para resetar
 */
function reset() {
    $('#app-menu-reset').click(function(event) {
        
        event.preventDefault();
        
        // Verifica se o processador est� executando
        if ($('#processor li').length > 0) {
            
            // For�a o reset assim que o processador estiver livre
            setTimeout(forceReset, 1000);
            
        } else {
        
            // Reseta as vari�veis
            time = 0;
            processTime = 0;
            canTickTock = true;
            nextToBeAdded = 1;

            // Limpa a lista de prontos
            $('#ready li').each(function () {
                $(this).remove();
            });

            // Limpa o pool de bloqueados
            $('#blocked li').each(function () {
                $(this).remove();
            });

            // Limpa a lista de conclu�dos
            $('#finished li').each(function () {
                $(this).remove();
            });

            // Limpa o processador
            $('#processor li').each(function () {
                $(this).remove();
            });

            // Reseta o tamanho dos gr�ficos
            $('#graph li div.graph-mark').each(function () {
                $(this).find('div').animate({
                    'width' : '0'
                });
                $(this).animate({
                    'width' : '5px'
                });            
            });

            // Reseta o quantum
            $('#quantum').val('10');

            // Habilita o input do quantum
            $('#quantum').removeAttr("disabled");
            
            // Reseta o tempo do processador
            $('#processor').find('span').html("0ms");
            
            $('*').css('cursor', 'auto');
            $('#app-menu li span').css('cursor', 'pointer');
            $('#app-menu a').css('cursor', 'pointer');
            
            messageStatus("Processador est� livre para execu��o.");
            
        }
        
    });
}