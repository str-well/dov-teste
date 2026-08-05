<?php
/**
 * Plugin Name: DOV — Headless
 * Description: CPTs, campos, tamanhos de imagem, CORS, endurecimento e revalidação do Descubra o Vinho. Sem dependências.
 * Version: 2.1.0
 *
 * Instalar em: wp-content/mu-plugins/dov-headless.php
 *
 * Requer no wp-config.php, antes de "That's all":
 *
 *   define( 'DOV_FRONT_ORIGIN',      'https://descubraovinho.com.br' );
 *   define( 'DOV_REVALIDATE_SECRET', 'o-mesmo-segredo-do-painel-do-next' );
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ===========================================================================
// 1 · ESQUEMA DE CAMPOS
//
// Fonte única de verdade. Alimenta o registro na REST API, o desenho das
// caixas no editor e a sanitização na gravação. Para acrescentar um campo,
// basta editar aqui.
//
// Tipos: text · textarea · date · url · posts
// ===========================================================================

function dov_esquema() {
	return array(

		'verbete' => array(
			'titulo' => 'Dados do verbete',
			'campos' => array(
				'dov_classe_gramatical' => array(
					'label' => 'Classe gramatical',
					'tipo'  => 'text',
					'ajuda' => 'Ex.: substantivo masculino. Abre a linha logo abaixo do título.',
				),
				'dov_definicao_curta' => array(
					'label' => 'Definição curta',
					'tipo'  => 'textarea',
					'ajuda' => 'Uma frase. Aparece nos cards do índice A–Z e nos resultados de busca.',
				),
				'dov_etimologia' => array(
					'label' => 'Etimologia',
					'tipo'  => 'text',
					'ajuda' => 'Ex.: do francês terre, terra',
				),
				'dov_pronuncia' => array(
					'label' => 'Pronúncia',
					'tipo'  => 'text',
					'ajuda' => 'Ex.: terruár',
				),
				'dov_na_pratica' => array(
					'label' => 'Na prática',
					'tipo'  => 'textarea',
					'ajuda' => 'Conteúdo da caixa destacada. Opcional.',
				),
				'dov_relacionados' => array(
					'label' => 'Verbetes relacionados',
					'tipo'  => 'posts',
					'de'    => 'verbete',
					'ajuda' => 'Ctrl (ou Cmd) para escolher mais de um.',
				),
			),
		),

		'evento' => array(
			'titulo' => 'Dados do evento',
			'campos' => array(
				'dov_data_inicio' => array(
					'label' => 'Data de início',
					'tipo'  => 'date',
				),
				'dov_data_fim' => array(
					'label' => 'Data de término',
					'tipo'  => 'date',
					'ajuda' => 'Deixe vazio se for de um dia só.',
				),
				'dov_local' => array(
					'label' => 'Local',
					'tipo'  => 'text',
					'ajuda' => 'Ex.: São Paulo · Bento Gonçalves · online',
				),
				'dov_link' => array(
					'label' => 'Link externo',
					'tipo'  => 'url',
				),
			),
		),

		'post' => array(
			'titulo' => 'Dados da matéria',
			'campos' => array(
				'dov_credito_foto' => array(
					'label' => 'Crédito da foto de destaque',
					'tipo'  => 'text',
					'ajuda' => 'Ex.: Foto: Ana Ferraz',
				),
				'dov_verbetes_relacionados' => array(
					'label' => 'Verbetes do Almanaque',
					'tipo'  => 'posts',
					'de'    => 'verbete',
					'ajuda' => 'Alimenta a caixa "Do Almanaque" na barra lateral.',
				),
				'dov_seo_titulo' => array(
					'label' => 'Título para busca',
					'tipo'  => 'text',
					'ajuda' => 'Opcional. Vazio usa o título da matéria.',
				),
				'dov_seo_descricao' => array(
					'label' => 'Descrição para busca',
					'tipo'  => 'textarea',
					'ajuda' => 'Opcional, até 155 caracteres. Vazio usa o resumo.',
				),
			),
		),
	);
}

// ===========================================================================
// 2 · TIPOS DE CONTEÚDO
// ===========================================================================

add_action( 'init', function () {

	register_post_type( 'verbete', array(
		'labels' => array(
			'name'          => 'Verbetes',
			'singular_name' => 'Verbete',
			'add_new_item'  => 'Adicionar verbete',
			'edit_item'     => 'Editar verbete',
			'search_items'  => 'Buscar verbetes',
			'not_found'     => 'Nenhum verbete encontrado',
		),
		'public'        => true,
		'has_archive'   => false,
		'menu_icon'     => 'dashicons-book-alt',
		'menu_position' => 21,
		'supports'      => array( 'title', 'editor', 'revisions', 'custom-fields' ),
		'rewrite'       => array( 'slug' => 'almanaque', 'with_front' => false ),
		'show_in_rest'  => true,
		'rest_base'     => 'verbetes',
	) );

	register_post_type( 'evento', array(
		'labels' => array(
			'name'          => 'Eventos',
			'singular_name' => 'Evento',
			'add_new_item'  => 'Adicionar evento',
			'edit_item'     => 'Editar evento',
			'not_found'     => 'Nenhum evento encontrado',
		),
		'public'        => true,
		'has_archive'   => false,
		'menu_icon'     => 'dashicons-calendar-alt',
		'menu_position' => 22,
		'supports'      => array( 'title', 'editor', 'thumbnail', 'revisions', 'custom-fields' ),
		'rewrite'       => array( 'slug' => 'agenda', 'with_front' => false ),
		'show_in_rest'  => true,
		'rest_base'     => 'eventos',
	) );
} );

// ===========================================================================
// 3 · REGISTRO DOS CAMPOS NA REST API
// ===========================================================================

add_action( 'init', function () {

	$pode = function () {
		return current_user_can( 'edit_posts' );
	};

	foreach ( dov_esquema() as $tipo_post => $grupo ) {
		foreach ( $grupo['campos'] as $chave => $campo ) {

			if ( 'posts' === $campo['tipo'] ) {
				register_post_meta( $tipo_post, $chave, array(
					'type'          => 'array',
					'single'        => true,
					'default'       => array(),
					'show_in_rest'  => array(
						'schema' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'integer' ),
						),
					),
					'auth_callback' => $pode,
				) );
				continue;
			}

			register_post_meta( $tipo_post, $chave, array(
				'type'          => 'string',
				'single'        => true,
				'default'       => '',
				'show_in_rest'  => true,
				'auth_callback' => $pode,
			) );
		}
	}

	// Calculado, não editável.
	register_post_meta( 'post', 'dov_tempo_leitura', array(
		'type'         => 'integer',
		'single'       => true,
		'default'      => 1,
		'show_in_rest' => true,
	) );

	// Autor.
	register_meta( 'user', 'dov_minibio', array(
		'type'         => 'string',
		'single'       => true,
		'show_in_rest' => true,
	) );
	register_meta( 'user', 'dov_retrato_url', array(
		'type'         => 'string',
		'single'       => true,
		'show_in_rest' => true,
	) );
} );

// ===========================================================================
// 4 · CAIXAS NO EDITOR
// ===========================================================================

add_action( 'add_meta_boxes', function () {
	foreach ( dov_esquema() as $tipo_post => $grupo ) {
		add_meta_box(
			'dov_box_' . $tipo_post,
			$grupo['titulo'],
			'dov_render_box',
			$tipo_post,
			'normal',
			'high',
			array( 'tipo_post' => $tipo_post )
		);
	}
} );

function dov_render_box( $post, $args ) {

	$tipo_post = $args['args']['tipo_post'];
	$esquema   = dov_esquema();

	if ( empty( $esquema[ $tipo_post ] ) ) {
		return;
	}

	wp_nonce_field( 'dov_salvar_' . $tipo_post, 'dov_nonce' );

	echo '<style>
		.dov-campo { margin: 0 0 18px; }
		.dov-campo > label { display:block; font-weight:600; margin-bottom:4px; }
		.dov-campo input[type=text], .dov-campo input[type=url], .dov-campo textarea { width:100%; }
		.dov-campo textarea { min-height:70px; }
		.dov-campo select[multiple] { width:100%; min-height:160px; }
		.dov-ajuda { color:#666; font-size:12px; margin-top:3px; }
	</style>';

	foreach ( $esquema[ $tipo_post ]['campos'] as $chave => $campo ) {

		$valor = get_post_meta( $post->ID, $chave, true );

		echo '<div class="dov-campo">';
		echo '<label for="' . esc_attr( $chave ) . '">' . esc_html( $campo['label'] ) . '</label>';

		switch ( $campo['tipo'] ) {

			case 'textarea':
				printf(
					'<textarea id="%1$s" name="%1$s" rows="3">%2$s</textarea>',
					esc_attr( $chave ),
					esc_textarea( is_string( $valor ) ? $valor : '' )
				);
				break;

			case 'date':
				printf(
					'<input type="date" id="%1$s" name="%1$s" value="%2$s">',
					esc_attr( $chave ),
					esc_attr( is_string( $valor ) ? $valor : '' )
				);
				break;

			case 'url':
				printf(
					'<input type="url" id="%1$s" name="%1$s" value="%2$s" placeholder="https://">',
					esc_attr( $chave ),
					esc_attr( is_string( $valor ) ? $valor : '' )
				);
				break;

			case 'posts':
				$escolhidos = is_array( $valor ) ? array_map( 'absint', $valor ) : array();
				$opcoes     = get_posts( array(
					'post_type'      => $campo['de'],
					'post_status'    => array( 'publish', 'draft' ),
					'posts_per_page' => -1,
					'orderby'        => 'title',
					'order'          => 'ASC',
					'fields'         => 'ids',
				) );

				printf( '<select id="%1$s" name="%1$s[]" multiple>', esc_attr( $chave ) );
				foreach ( $opcoes as $id_opcao ) {
					if ( (int) $id_opcao === (int) $post->ID ) {
						continue; // nada se relaciona consigo mesmo
					}
					printf(
						'<option value="%d"%s>%s</option>',
						$id_opcao,
						in_array( (int) $id_opcao, $escolhidos, true ) ? ' selected' : '',
						esc_html( get_the_title( $id_opcao ) )
					);
				}
				echo '</select>';
				break;

			default: // text
				printf(
					'<input type="text" id="%1$s" name="%1$s" value="%2$s">',
					esc_attr( $chave ),
					esc_attr( is_string( $valor ) ? $valor : '' )
				);
		}

		if ( ! empty( $campo['ajuda'] ) ) {
			echo '<p class="dov-ajuda">' . esc_html( $campo['ajuda'] ) . '</p>';
		}

		echo '</div>';
	}
}

add_action( 'save_post', function ( $post_id, $post ) {

	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$esquema   = dov_esquema();
	$tipo_post = $post->post_type;

	if ( empty( $esquema[ $tipo_post ] ) ) {
		return;
	}
	if ( empty( $_POST['dov_nonce'] ) || ! wp_verify_nonce( $_POST['dov_nonce'], 'dov_salvar_' . $tipo_post ) ) {
		return;
	}

	foreach ( $esquema[ $tipo_post ]['campos'] as $chave => $campo ) {

		if ( 'posts' === $campo['tipo'] ) {
			$lista = isset( $_POST[ $chave ] ) && is_array( $_POST[ $chave ] )
				? array_values( array_unique( array_filter( array_map( 'absint', $_POST[ $chave ] ) ) ) )
				: array();
			update_post_meta( $post_id, $chave, $lista );
			continue;
		}

		if ( ! isset( $_POST[ $chave ] ) ) {
			continue;
		}

		$bruto = wp_unslash( $_POST[ $chave ] );

		switch ( $campo['tipo'] ) {
			case 'textarea':
				$limpo = sanitize_textarea_field( $bruto );
				break;
			case 'url':
				$limpo = esc_url_raw( $bruto );
				break;
			case 'date':
				$limpo = preg_match( '/^\d{4}-\d{2}-\d{2}$/', $bruto ) ? $bruto : '';
				break;
			default:
				$limpo = sanitize_text_field( $bruto );
		}

		update_post_meta( $post_id, $chave, $limpo );
	}
}, 10, 2 );

// ===========================================================================
// 5 · CAMPOS DO AUTOR
// ===========================================================================

add_action( 'show_user_profile', 'dov_campos_autor' );
add_action( 'edit_user_profile', 'dov_campos_autor' );

function dov_campos_autor( $user ) {
	wp_nonce_field( 'dov_salvar_autor', 'dov_nonce_autor' );
	?>
	<h2>Descubra o Vinho</h2>
	<table class="form-table">
		<tr>
			<th><label for="dov_minibio">Minibio</label></th>
			<td>
				<textarea id="dov_minibio" name="dov_minibio" rows="3" class="regular-text"><?php
					echo esc_textarea( get_user_meta( $user->ID, 'dov_minibio', true ) );
				?></textarea>
				<p class="description">Uma ou duas frases, exibidas na assinatura da matéria.</p>
			</td>
		</tr>
		<tr>
			<th><label for="dov_retrato_url">Retrato (URL)</label></th>
			<td>
				<input type="url" id="dov_retrato_url" name="dov_retrato_url" class="regular-text"
					value="<?php echo esc_attr( get_user_meta( $user->ID, 'dov_retrato_url', true ) ); ?>">
				<p class="description">
					Envie a imagem em Mídia (240×240) e cole aqui o endereço do arquivo.
				</p>
			</td>
		</tr>
	</table>
	<?php
}

add_action( 'personal_options_update', 'dov_salvar_autor' );
add_action( 'edit_user_profile_update', 'dov_salvar_autor' );

function dov_salvar_autor( $user_id ) {
	if ( ! current_user_can( 'edit_user', $user_id ) ) {
		return;
	}
	if ( empty( $_POST['dov_nonce_autor'] ) || ! wp_verify_nonce( $_POST['dov_nonce_autor'], 'dov_salvar_autor' ) ) {
		return;
	}
	if ( isset( $_POST['dov_minibio'] ) ) {
		update_user_meta( $user_id, 'dov_minibio', sanitize_textarea_field( wp_unslash( $_POST['dov_minibio'] ) ) );
	}
	if ( isset( $_POST['dov_retrato_url'] ) ) {
		update_user_meta( $user_id, 'dov_retrato_url', esc_url_raw( wp_unslash( $_POST['dov_retrato_url'] ) ) );
	}
}

// ===========================================================================
// 6 · TEMPO DE LEITURA
//
// preg_split com /u conta palavras acentuadas corretamente — str_word_count
// erra em português. 200 palavras por minuto, mínimo de 1.
// ===========================================================================

add_action( 'save_post_post', function ( $post_id, $post ) {
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	$texto = trim( wp_strip_all_tags( (string) $post->post_content ) );
	$n     = '' === $texto ? 0 : count( preg_split( '/\s+/u', $texto ) );
	update_post_meta( $post_id, 'dov_tempo_leitura', max( 1, (int) ceil( $n / 200 ) ) );
}, 20, 2 );

// ===========================================================================
// 7 · IMAGENS
// ===========================================================================

add_action( 'after_setup_theme', function () {
	add_theme_support( 'post-thumbnails' );

	add_image_size( 'dov_hero',     1920, 1080, true );  // 16:9 — hero da home
	add_image_size( 'dov_destaque', 1600, 1067, true );  // 3:2  — topo da matéria
	add_image_size( 'dov_card_4x3', 1200,  900, true );  // 4:3  — card em destaque
	add_image_size( 'dov_corpo',    1200,    0, false ); // largura fixa
	add_image_size( 'dov_card',      800,  533, true );  // 3:2  — card padrão
	add_image_size( 'dov_retrato',   240,  240, true );  // 1:1  — autor
} );

// Tamanhos padrão que ninguém vai usar.
add_filter( 'intermediate_image_sizes_advanced', function ( $sizes ) {
	unset( $sizes['medium_large'], $sizes['1536x1536'], $sizes['2048x2048'] );
	return $sizes;
} );

/**
 * Entrega as URLs dos tamanhos nomeados dentro da própria resposta, em
 * `dov_imagens`. Evita uma requisição extra a /media por post — importante,
 * porque o plano é compartilhado com outros sites.
 */
add_action( 'rest_api_init', function () {
	// `page` está na lista por causa da foto de Quem Somos, que não tinha de onde vir.
	foreach ( array( 'post', 'page', 'verbete', 'evento' ) as $tipo ) {
		register_rest_field( $tipo, 'dov_imagens', array(
			'get_callback' => function ( $obj ) {
				$id = get_post_thumbnail_id( $obj['id'] );
				if ( ! $id ) {
					return null;
				}
				$saida = array(
					'alt' => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
				);
				foreach ( array( 'dov_hero', 'dov_destaque', 'dov_card_4x3', 'dov_corpo', 'dov_card', 'dov_retrato' ) as $tamanho ) {
					$src = wp_get_attachment_image_src( $id, $tamanho );
					if ( $src ) {
						$saida[ $tamanho ] = array(
							'url' => $src[0],
							'w'   => (int) $src[1],
							'h'   => (int) $src[2],
						);
					}
				}
				return $saida;
			},
			'schema' => array( 'type' => 'object' ),
		) );
	}
} );

// ===========================================================================
// 8 · CORS
// ===========================================================================

add_action( 'rest_api_init', function () {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );

	add_filter( 'rest_pre_serve_request', function ( $valor ) {
		$origem    = get_http_origin();
		$permitida = defined( 'DOV_FRONT_ORIGIN' ) ? DOV_FRONT_ORIGIN : '';

		if ( $origem && $permitida && $origem === $permitida ) {
			header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origem ) );
			header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
			header( 'Access-Control-Allow-Headers: Content-Type, Authorization' );
			header( 'Vary: Origin' );
		}
		return $valor;
	} );
}, 15 );

// ===========================================================================
// 9 · REVALIDAÇÃO SOB DEMANDA
// ===========================================================================

add_action( 'transition_post_status', function ( $novo, $antigo, $post ) {

	if ( ! in_array( $post->post_type, array( 'post', 'verbete', 'evento', 'page' ), true ) ) {
		return;
	}
	if ( 'publish' !== $novo && 'publish' !== $antigo ) {
		return;
	}
	if ( wp_is_post_revision( $post->ID ) || wp_is_post_autosave( $post->ID ) ) {
		return;
	}
	if ( ! defined( 'DOV_REVALIDATE_SECRET' ) || ! defined( 'DOV_FRONT_ORIGIN' ) ) {
		return;
	}

	// Trava: uma rodada por post a cada 10 segundos.
	$trava = 'dov_reval_' . $post->ID;
	if ( get_transient( $trava ) ) {
		return;
	}
	set_transient( $trava, 1, 10 );

	$caminhos = array( '/' );

	if ( 'post' === $post->post_type ) {
		$termos = get_the_category( $post->ID );
		if ( ! empty( $termos ) ) {
			$cat        = $termos[0]->slug;
			$caminhos[] = '/' . $cat;
			$caminhos[] = '/' . $cat . '/' . $post->post_name;
		}
	} elseif ( 'verbete' === $post->post_type ) {
		$caminhos[] = '/almanaque';
		$caminhos[] = '/almanaque/' . $post->post_name;
	} elseif ( 'evento' === $post->post_type ) {
		$caminhos[] = '/programe-se';
	} elseif ( 'page' === $post->post_type ) {
		$caminhos[] = '/' . $post->post_name;
	}

	foreach ( array_unique( $caminhos ) as $caminho ) {
		wp_remote_post(
			add_query_arg(
				array(
					'secret' => DOV_REVALIDATE_SECRET,
					'path'   => $caminho,
				),
				DOV_FRONT_ORIGIN . '/api/revalidate'
			),
			array(
				'timeout'  => 5,
				'blocking' => false, // não deixa o editor esperando
			)
		);
	}
}, 10, 3 );

// ===========================================================================
// 10 · ENDURECIMENTO E LIMPEZA
// ===========================================================================

if ( ! defined( 'DISALLOW_FILE_EDIT' ) ) {
	define( 'DISALLOW_FILE_EDIT', true );
}

add_filter( 'xmlrpc_enabled', '__return_false' );
remove_action( 'wp_head', 'wp_generator' );

add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );

/**
 * O front do WordPress não deve ser visto por ninguém.
 * Admin, login, REST API e uploads seguem acessíveis.
 */
add_action( 'template_redirect', function () {
	if ( is_admin() || is_user_logged_in() ) {
		return;
	}
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return;
	}
	if ( ! defined( 'DOV_FRONT_ORIGIN' ) ) {
		return;
	}
	wp_safe_redirect( DOV_FRONT_ORIGIN, 302 );
	exit;
} );

add_action( 'wp_head', function () {
	echo '<meta name="robots" content="noindex, nofollow">' . "\n";
}, 1 );
