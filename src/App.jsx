
import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import api from "./services/api";

function erro(e) {
  const d = e.response?.data?.detail;
  if (d) return Array.isArray(d) ? d.map(x => x.msg).join(", ") : String(d);
  if (e.response?.status === 401) return "Chave ausente ou inválida. Confira seu .env.";
  return "Não foi possível conectar à API.";
}

function lista(data, chave) {
  return Array.isArray(data) ? data : data?.[chave] || [];
}

function nome(x) {
  return typeof x === "string" ? x : x.nome || x.valor;
}

function data(d) {
  if (!d) return "data não informada";
  const p = String(d).slice(0, 10).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

function Layout({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [erroUsuario, setErroUsuario] = useState("");

  useEffect(() => {
    api.get("/eu").then(r => setUsuario(r.data)).catch(e => setErroUsuario(erro(e)));
  }, []);

  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" to="/"><span className="brand-mark">A</span><span>Achados<span className="brand-light"> IFRN</span></span></Link>
      <div className="user-pill"><span className="user-dot" /> Olá, {usuario?.nome || usuario?.name || "estudante"}</div>
    </header>
    {erroUsuario && <div className="notice error top-notice">{erroUsuario}</div>}
    <main>{children}</main>
    <footer>Feito para facilitar o encontro entre objetos e seus donos.</footer>
  </div>;
}

function Home() {
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [filtros, setFiltros] = useState({ busca: "", status: "", categoria: "", local: "" });
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [atualizar, setAtualizar] = useState(0);

  const mudar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  useEffect(() => {
    api.get("/categorias").then(r => setCategorias(lista(r.data, "categorias"))).catch(() => {});
    api.get("/locais").then(r => setLocais(lista(r.data, "locais"))).catch(() => {});
  }, []);

  useEffect(() => {
    let ativo = true;
    const params = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v.trim()) params[k] = v.trim();
    });

    setCarregando(true);
    setErroLista("");

    api.get("/itens", { params })
      .then(r => { if (ativo) setItens(lista(r.data, "itens")); })
      .catch(e => { if (ativo) setErroLista(erro(e)); })
      .finally(() => { if (ativo) setCarregando(false); });

    return () => { ativo = false; };
  }, [filtros, atualizar]);

  return <Layout>
    <section className="hero">
      <div className="eyebrow"><span className="eyebrow-dot" /> ORGANIZAÇÃO DO CAMPUS</div>
      <h1>Perdeu alguma coisa?<br /><span>Vamos encontrar.</span></h1>
      <p>Consulte os objetos encontrados no campus e ajude cada item a voltar para seu dono.</p>
      <div className="hero-actions">
        <a href="#lista" className="button primary">Explorar itens ↓</a>
        <Link to="/novo" className="button secondary">＋ Cadastrar item</Link>
      </div>
      <div className="hero-decoration"><div className="deco-circle c1" /><div className="deco-circle c2" /><div className="deco-box">✓</div></div>
    </section>

    <section id="lista" className="list-section">
      <div className="section-heading">
        <div><div className="eyebrow">CATÁLOGO DO CAMPUS</div><h2>Itens encontrados</h2><p>Encontre o que você perdeu usando a busca e os filtros.</p></div>
        <button className="button secondary refresh" onClick={() => setAtualizar(n => n + 1)}>↻ Atualizar</button>
      </div>

      <div className="filters">
        <label className="search-box"><span>⌕</span><input name="busca" value={filtros.busca} onChange={mudar} placeholder="Buscar por nome ou descrição..." /></label>
        <select name="status" value={filtros.status} onChange={mudar}><option value="">Todos os status</option><option value="aguardando">Aguardando</option><option value="devolvido">Devolvido</option></select>
        {[["categoria", categorias, "Todas as categorias"], ["local", locais, "Todos os locais"]].map(([campo, opcoes, titulo]) =>
          <select key={campo} name={campo} value={filtros[campo]} onChange={mudar}>
            <option value="">{titulo}</option>
            {opcoes.map((x, i) => <option key={i} value={nome(x)}>{nome(x)}</option>)}
          </select>
        )}
      </div>

      {carregando ? <div className="state-card"><div className="spinner" /><h3>Carregando itens...</h3><p>Estamos consultando a lista do campus.</p></div>
      : erroLista ? <div className="state-card"><div className="state-icon danger">!</div><h3>Não foi possível carregar</h3><p>{erroLista}</p><button className="button primary" onClick={() => setAtualizar(n => n + 1)}>Tentar novamente</button></div>
      : !itens.length ? <div className="state-card"><div className="state-icon">⌕</div><h3>Nenhum item encontrado</h3><p>Tente mudar os filtros ou cadastre um item encontrado.</p><Link className="button primary" to="/novo">Cadastrar item</Link></div>
      : <div className="item-grid">{itens.map(item =>
        <Link className="item-card" to={`/item/${item.id}`} key={item.id}>
          <div className="item-card-top"><span className="item-symbol">{(item.nome || "?")[0].toUpperCase()}</span><span className={`status ${item.status === "devolvido" ? "returned" : "waiting"}`}>{item.status === "devolvido" ? "Devolvido" : "Aguardando"}</span></div>
          <h3>{item.nome}</h3><p className="item-description">{item.descricao || "Sem descrição informada."}</p>
          <div className="item-meta"><span>▦ {item.categoria || "Sem categoria"}</span><span>⌖ {item.local || "Local não informado"}</span></div>
          <div className="item-date">Encontrado em {data(item.data_encontrado)}<span>↗</span></div>
        </Link>
      )}</div>}
    </section>
  </Layout>;
}

function FormItem({ editar = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", descricao: "", categoria: "", local: "", data_encontrado: "" });
  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(editar);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    api.get("/categorias").then(r => setCategorias(lista(r.data, "categorias"))).catch(() => {});
    api.get("/locais").then(r => setLocais(lista(r.data, "locais"))).catch(() => {});
    if (editar) api.get(`/itens/${id}`).then(r => {
      const i = r.data?.item || r.data;
      setForm({ nome: i.nome || "", descricao: i.descricao || "", categoria: i.categoria || "", local: i.local || "", data_encontrado: i.data_encontrado || "" });
    }).catch(e => setErroForm(erro(e))).finally(() => setCarregando(false));
  }, [editar, id]);

  const mudar = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    setErroForm("");
    setSucesso("");
    setSalvando(true);
    try {
      if (editar) await api.put(`/itens/${id}`, form);
      else await api.post("/itens", form);
      setSucesso(editar ? "Item atualizado com sucesso!" : "Item cadastrado com sucesso!");
      setTimeout(() => navigate(editar ? `/item/${id}` : "/"), 700);
    } catch (e) {
      setErroForm(erro(e));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Layout><div className="state-card"><div className="spinner" /><h3>Carregando formulário...</h3></div></Layout>;

  return <Layout><section className="form-wrap">
    <Link className="back-link" to={editar ? `/item/${id}` : "/"}>← Voltar</Link>
    <div className="form-heading"><div className="eyebrow">{editar ? "ATUALIZAÇÃO DE REGISTRO" : "NOVO REGISTRO"}</div><h1>{editar ? "Editar item" : "Cadastrar item"}</h1><p>Preencha as informações para manter o catálogo organizado.</p></div>
    <form className="form-card" onSubmit={salvar}>
      <label>Nome do item<input required name="nome" value={form.nome} onChange={mudar} placeholder="Ex.: Garrafa azul" /></label>
      <label>Descrição<textarea required name="descricao" value={form.descricao} onChange={mudar} rows="4" placeholder="Descreva características que ajudem a identificar o item" /></label>
      <div className="form-row">
        {[["categoria", categorias, "Selecione uma categoria"], ["local", locais, "Selecione um local"]].map(([campo, opcoes, titulo]) =>
          <label key={campo}>{campo === "local" ? "Local encontrado" : "Categoria"}
            <select required name={campo} value={form[campo]} onChange={mudar}>
              <option value="">{titulo}</option>
              {opcoes.map((x, i) => <option key={i} value={nome(x)}>{nome(x)}</option>)}
              {form[campo] && !opcoes.some(x => nome(x) === form[campo]) && <option value={form[campo]}>{form[campo]}</option>}
            </select>
          </label>
        )}
      </div>
      <label>Data em que foi encontrado<input required type="date" name="data_encontrado" value={form.data_encontrado} onChange={mudar} /></label>
      {erroForm && <div className="notice error">{erroForm}</div>}
      {sucesso && <div className="notice success">{sucesso}</div>}
      <div className="form-actions"><Link className="button secondary" to={editar ? `/item/${id}` : "/"}>Cancelar</Link><button className="button primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar item →"}</button></div>
    </form>
  </section></Layout>;
}

function Detalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroItem, setErroItem] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [devolvendo, setDevolvendo] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    setCarregando(true);
    setErroItem("");
    try {
      const r = await api.get(`/itens/${id}`);
      setItem(r.data?.item || r.data);
    } catch (e) {
      setErroItem(erro(e));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [id]);

  async function excluir() {
    if (!window.confirm("Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/itens/${id}`);
      navigate("/");
    } catch (e) {
      setErroItem(erro(e));
    }
  }

  async function devolver(e) {
    e.preventDefault();
    setErroItem("");
    setMensagem("");
    setDevolvendo(true);
    try {
      await api.patch(`/itens/${id}/devolver`, { devolvido_para: destinatario });
      setMensagem("Item marcado como devolvido.");
      await carregar();
    } catch (e) {
      setErroItem(erro(e));
    } finally {
      setDevolvendo(false);
    }
  }

  return <Layout><section className="detail-wrap">
    <Link className="back-link" to="/">← Voltar para os itens</Link>
    {carregando ? <div className="state-card"><div className="spinner" /><h3>Carregando item...</h3></div>
    : erroItem && !item ? <div className="state-card"><div className="state-icon danger">!</div><h3>Não foi possível abrir o item</h3><p>{erroItem}</p><button className="button primary" onClick={carregar}>Tentar novamente</button></div>
    : item && <>
      <div className="detail-header"><div><div className="eyebrow">DETALHES DO REGISTRO</div><h1>{item.nome}</h1><p>Confira as informações do objeto encontrado.</p></div><span className={`status ${item.status === "devolvido" ? "returned" : "waiting"}`}>{item.status === "devolvido" ? "Devolvido" : "Aguardando"}</span></div>
      <article className="detail-card">
        <div className="detail-symbol">{(item.nome || "?")[0].toUpperCase()}</div>
        <div className="detail-grid">
          {[["Descrição", item.descricao || "Sem descrição informada.", true], ["Categoria", item.categoria || "Não informada"], ["Local encontrado", item.local || "Não informado"], ["Data em que foi encontrado", data(item.data_encontrado)], ...(item.devolvido_para ? [["Devolvido para", item.devolvido_para]] : []), ...(item.data_devolucao ? [["Data da devolução", data(item.data_devolucao)]] : [])].map(([titulo, valor, wide]) =>
            <div className={`detail-field ${wide ? "wide" : ""}`} key={titulo}><span>{titulo}</span><p>{valor}</p></div>
          )}
        </div>
        {erroItem && <div className="notice error">{erroItem}</div>}
        {mensagem && <div className="notice success">{mensagem}</div>}
        <div className="detail-actions"><Link className="button secondary" to={`/editar/${item.id}`}>✎ Editar</Link><button className="button danger-button" onClick={excluir}>Excluir</button></div>
      </article>
      {item.status !== "devolvido" && <form className="return-card" onSubmit={devolver}>
        <div className="return-title"><span className="return-icon">✓</span><div><h2>Registrar devolução</h2><p>Informe quem recebeu o objeto.</p></div></div>
        <label>Nome de quem recebeu<input required value={destinatario} onChange={e => setDestinatario(e.target.value)} placeholder="Nome completo" /></label>
        <button className="button primary" disabled={devolvendo}>{devolvendo ? "Confirmando..." : "Confirmar devolução →"}</button>
      </form>}
    </>}
  </section></Layout>;
}

function NaoEncontrada() {
  return <Layout><div className="state-card"><div className="state-icon">?</div><h3>Página não encontrada</h3><p>Esse endereço não existe no sistema.</p><Link className="button primary" to="/">Voltar ao início</Link></div></Layout>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/novo" element={<FormItem />} />
    <Route path="/editar/:id" element={<FormItem editar />} />
    <Route path="/item/:id" element={<Detalhe />} />
    <Route path="*" element={<NaoEncontrada />} />
  </Routes>;
}
