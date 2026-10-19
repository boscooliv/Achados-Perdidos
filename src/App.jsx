
import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import api from "./services/api";

function mensagemErro(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    return Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : String(detail);
  }

  if (error.response?.status === 401) {
    return "Chave ausente ou inválida. Confira seu arquivo .env.";
  }

  return "Não foi possível conectar à API. Tente novamente.";
}

function Layout({ children }) {
  const [dono, setDono] = useState(null);
  const [erroDono, setErroDono] = useState("");

  useEffect(() => {
    api.get("/eu")
      .then((res) => setDono(res.data))
      .catch((err) => setErroDono(mensagemErro(err)));
  }, []);

  const nome = dono?.nome || dono?.name || "estudante";

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">A</span>
          <span>Achados<span className="brand-light"> IFRN</span></span>
        </Link>
        <div className="user-pill">
          <span className="user-dot" /> Olá, {nome}
        </div>
      </header>

      {erroDono && <div className="notice error top-notice">{erroDono}</div>}

      <main>{children}</main>
      <footer>Feito para facilitar o encontro entre objetos e seus donos.</footer>
    </div>
  );
}

function formatarData(data) {
  if (!data) return "data não informada";

  const [ano, mes, dia] = String(data).slice(0, 10).split("-");

  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function Home() {
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [categoria, setCategoria] = useState("");
  const [local, setLocal] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizar, setAtualizar] = useState(0);

  useEffect(() => {
    api.get("/categorias")
      .then((r) => {
        setCategorias(
          Array.isArray(r.data) ? r.data : r.data?.categorias || []
        );
      })
      .catch(() => setCategorias([]));

    api.get("/locais")
      .then((r) => {
        setLocais(
          Array.isArray(r.data) ? r.data : r.data?.locais || []
        );
      })
      .catch(() => setLocais([]));
  }, []);

  useEffect(() => {
    let ativo = true;

    setCarregando(true);
    setErro("");

    const params = {};

    if (busca.trim()) params.busca = busca.trim();
    if (status) params.status = status;
    if (categoria) params.categoria = categoria;
    if (local) params.local = local;

    api.get("/itens", { params })
      .then((r) => {
        if (ativo) {
          setItens(
            Array.isArray(r.data) ? r.data : r.data?.itens || []
          );
        }
      })
      .catch((e) => {
        if (ativo) setErro(mensagemErro(e));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [busca, status, categoria, local, atualizar]);

  return (
    <Layout>
      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> ORGANIZAÇÃO DO CAMPUS
        </div>

        <h1>
          Perdeu alguma coisa?
          <br />
          <span>Vamos encontrar.</span>
        </h1>

        <p>
          Consulte os objetos encontrados no campus e ajude cada item
          a voltar para seu dono.
        </p>

        <div className="hero-actions">
          <a href="#lista" className="button primary">
            Explorar itens <span>↓</span>
          </a>
          <Link to="/novo" className="button secondary">
            <span>＋</span> Cadastrar item
          </Link>
        </div>

        <div className="hero-decoration">
          <div className="deco-circle c1" />
          <div className="deco-circle c2" />
          <div className="deco-box">✓</div>
        </div>
      </section>

      <section id="lista" className="list-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">CATÁLOGO DO CAMPUS</div>
            <h2>Itens encontrados</h2>
            <p>Encontre o que você perdeu usando a busca e os filtros.</p>
          </div>

          <button
            className="button secondary refresh"
            onClick={() => setAtualizar((n) => n + 1)}
          >
            ↻ Atualizar
          </button>
        </div>

        <div className="filters">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
            />
          </label>

          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="aguardando">Aguardando</option>
            <option value="devolvido">Devolvido</option>
          </select>

          <select
            aria-label="Filtrar por categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c, i) => {
              const valor = typeof c === "string" ? c : c.nome || c.valor;
              return <option key={i} value={valor}>{valor}</option>;
            })}
          </select>

          <select
            aria-label="Filtrar por local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          >
            <option value="">Todos os locais</option>
            {locais.map((l, i) => {
              const valor = typeof l === "string" ? l : l.nome || l.valor;
              return <option key={i} value={valor}>{valor}</option>;
            })}
          </select>
        </div>

        {carregando ? (
          <div className="state-card">
            <div className="spinner" />
            <h3>Carregando itens...</h3>
            <p>Estamos consultando a lista do campus.</p>
          </div>
        ) : erro ? (
          <div className="state-card">
            <div className="state-icon danger">!</div>
            <h3>Não foi possível carregar</h3>
            <p>{erro}</p>
            <button
              className="button primary"
              onClick={() => setAtualizar((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : itens.length === 0 ? (
          <div className="state-card">
            <div className="state-icon">⌕</div>
            <h3>Nenhum item encontrado</h3>
            <p>Tente mudar os filtros ou cadastre um item encontrado.</p>
            <Link className="button primary" to="/novo">
              Cadastrar item
            </Link>
          </div>
        ) : (
          <div className="item-grid">
            {itens.map((item) => (
              <Link className="item-card" to={`/item/${item.id}`} key={item.id}>
                <div className="item-card-top">
                  <span className="item-symbol">
                    {(item.nome || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className={`status ${item.status === "devolvido" ? "returned" : "waiting"}`}>
                    {item.status === "devolvido" ? "Devolvido" : "Aguardando"}
                  </span>
                </div>

                <h3>{item.nome}</h3>
                <p className="item-description">
                  {item.descricao || "Sem descrição informada."}
                </p>

                <div className="item-meta">
                  <span>▦ {item.categoria || "Sem categoria"}</span>
                  <span>⌖ {item.local || "Local não informado"}</span>
                </div>

                <div className="item-date">
                  Encontrado em {formatarData(item.data_encontrado)}
                  <span>↗</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function FormItem({ editar = false }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    categoria: "",
    local: "",
    data_encontrado: ""
  });
  const [carregando, setCarregando] = useState(editar);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    api.get("/categorias")
      .then((r) => setCategorias(
        Array.isArray(r.data) ? r.data : r.data?.categorias || []
      ))
      .catch(() => {});

    api.get("/locais")
      .then((r) => setLocais(
        Array.isArray(r.data) ? r.data : r.data?.locais || []
      ))
      .catch(() => {});

    if (editar) {
      api.get(`/itens/${id}`)
        .then((r) => {
          const item = r.data?.item || r.data;

          setForm({
            nome: item.nome || "",
            descricao: item.descricao || "",
            categoria: item.categoria || "",
            local: item.local || "",
            data_encontrado: item.data_encontrado || ""
          });
        })
        .catch((e) => setErro(mensagemErro(e)))
        .finally(() => setCarregando(false));
    }
  }, [editar, id]);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      if (editar) {
        await api.put(`/itens/${id}`, form);
      } else {
        await api.post("/itens", form);
      }

      setSucesso(
        editar ? "Item atualizado com sucesso!" : "Item cadastrado com sucesso!"
      );

      setTimeout(() => navigate(editar ? `/item/${id}` : "/"), 700);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout>
        <div className="state-card">
          <div className="spinner" />
          <h3>Carregando formulário...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="form-wrap">
        <Link className="back-link" to={editar ? `/item/${id}` : "/"}>
          ← Voltar
        </Link>

        <div className="form-heading">
          <div className="eyebrow">
            {editar ? "ATUALIZAÇÃO DE REGISTRO" : "NOVO REGISTRO"}
          </div>
          <h1>{editar ? "Editar item" : "Cadastrar item"}</h1>
          <p>Preencha as informações para manter o catálogo organizado.</p>
        </div>

        <form className="form-card" onSubmit={salvar}>
          <label>
            Nome do item
            <input
              required
              name="nome"
              value={form.nome}
              onChange={mudar}
              placeholder="Ex.: Garrafa azul"
            />
          </label>

          <label>
            Descrição
            <textarea
              required
              name="descricao"
              value={form.descricao}
              onChange={mudar}
              rows="4"
              placeholder="Descreva características que ajudem a identificar o item"
            />
          </label>

          <div className="form-row">
            <label>
              Categoria
              <select
                required
                name="categoria"
                value={form.categoria}
                onChange={mudar}
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((c, i) => {
                  const valor = typeof c === "string" ? c : c.nome || c.valor;
                  return <option key={i} value={valor}>{valor}</option>;
                })}
                {form.categoria && !categorias.some(
                  (c) => (typeof c === "string" ? c : c.nome || c.valor) === form.categoria
                ) && <option value={form.categoria}>{form.categoria}</option>}
              </select>
            </label>

            <label>
              Local encontrado
              <select
                required
                name="local"
                value={form.local}
                onChange={mudar}
              >
                <option value="">Selecione um local</option>
                {locais.map((l, i) => {
                  const valor = typeof l === "string" ? l : l.nome || l.valor;
                  return <option key={i} value={valor}>{valor}</option>;
                })}
                {form.local && !locais.some(
                  (l) => (typeof l === "string" ? l : l.nome || l.valor) === form.local
                ) && <option value={form.local}>{form.local}</option>}
              </select>
            </label>
          </div>

          <label>
            Data em que foi encontrado
            <input
              required
              type="date"
              name="data_encontrado"
              value={form.data_encontrado}
              onChange={mudar}
            />
          </label>

          {erro && <div className="notice error">{erro}</div>}
          {sucesso && <div className="notice success">{sucesso}</div>}

          <div className="form-actions">
            <Link className="button secondary" to={editar ? `/item/${id}` : "/"}>
              Cancelar
            </Link>
            <button className="button primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar item →"}
            </button>
          </div>
        </form>
      </section>
    </Layout>
  );
}

function Detalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [devolvendo, setDevolvendo] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const r = await api.get(`/itens/${id}`);
      setItem(r.data?.item || r.data);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function excluir() {
    if (!window.confirm("Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.")) {
      return;
    }

    try {
      await api.delete(`/itens/${id}`);
      navigate("/");
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  async function devolver(e) {
    e.preventDefault();
    setMensagem("");
    setErro("");
    setDevolvendo(true);

    try {
      await api.patch(`/itens/${id}/devolver`, {
        devolvido_para: destinatario
      });

      setMensagem("Item marcado como devolvido.");
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setDevolvendo(false);
    }
  }

  return (
    <Layout>
      <section className="detail-wrap">
        <Link className="back-link" to="/">← Voltar para os itens</Link>

        {carregando ? (
          <div className="state-card">
            <div className="spinner" />
            <h3>Carregando item...</h3>
          </div>
        ) : erro && !item ? (
          <div className="state-card">
            <div className="state-icon danger">!</div>
            <h3>Não foi possível abrir o item</h3>
            <p>{erro}</p>
            <button className="button primary" onClick={carregar}>
              Tentar novamente
            </button>
          </div>
        ) : item && (
          <>
            <div className="detail-header">
              <div>
                <div className="eyebrow">DETALHES DO REGISTRO</div>
                <h1>{item.nome}</h1>
                <p>Confira as informações do objeto encontrado.</p>
              </div>

              <span className={`status ${item.status === "devolvido" ? "returned" : "waiting"}`}>
                {item.status === "devolvido" ? "Devolvido" : "Aguardando"}
              </span>
            </div>

            <article className="detail-card">
              <div className="detail-symbol">
                {(item.nome || "?").slice(0, 1).toUpperCase()}
              </div>

              <div className="detail-grid">
                <div className="detail-field wide">
                  <span>Descrição</span>
                  <p>{item.descricao || "Sem descrição informada."}</p>
                </div>

                <div className="detail-field">
                  <span>Categoria</span>
                  <p>{item.categoria || "Não informada"}</p>
                </div>

                <div className="detail-field">
                  <span>Local encontrado</span>
                  <p>{item.local || "Não informado"}</p>
                </div>

                <div className="detail-field">
                  <span>Data em que foi encontrado</span>
                  <p>{formatarData(item.data_encontrado)}</p>
                </div>

                {item.devolvido_para && (
                  <div className="detail-field">
                    <span>Devolvido para</span>
                    <p>{item.devolvido_para}</p>
                  </div>
                )}

                {item.data_devolucao && (
                  <div className="detail-field">
                    <span>Data da devolução</span>
                    <p>{formatarData(item.data_devolucao)}</p>
                  </div>
                )}
              </div>

              {erro && <div className="notice error">{erro}</div>}
              {mensagem && <div className="notice success">{mensagem}</div>}

              <div className="detail-actions">
                <Link className="button secondary" to={`/editar/${item.id}`}>
                  ✎ Editar
                </Link>
                <button className="button danger-button" onClick={excluir}>
                  Excluir
                </button>
              </div>
            </article>

            {item.status !== "devolvido" && (
              <form className="return-card" onSubmit={devolver}>
                <div className="return-title">
                  <span className="return-icon">✓</span>
                  <div>
                    <h2>Registrar devolução</h2>
                    <p>Informe quem recebeu o objeto.</p>
                  </div>
                </div>

                <label>
                  Nome de quem recebeu
                  <input
                    required
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                    placeholder="Nome completo"
                  />
                </label>

                <button className="button primary" disabled={devolvendo}>
                  {devolvendo ? "Confirmando..." : "Confirmar devolução →"}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}

function NaoEncontrada() {
  return (
    <Layout>
      <div className="state-card">
        <div className="state-icon">?</div>
        <h3>Página não encontrada</h3>
        <p>Esse endereço não existe no sistema.</p>
        <Link className="button primary" to="/">Voltar ao início</Link>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/novo" element={<FormItem />} />
      <Route path="/editar/:id" element={<FormItem editar />} />
      <Route path="/item/:id" element={<Detalhe />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
