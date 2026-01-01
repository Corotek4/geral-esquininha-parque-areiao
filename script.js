// ======== STORAGE ========
let categorias = JSON.parse(localStorage.getItem('categorias') || '[]');
let produtos = JSON.parse(localStorage.getItem('produtos') || '[]');

const categoriaSelect = document.getElementById('categoria');
const listaCategorias = document.getElementById('lista-categorias');
const listaProdutos = document.getElementById('lista-produtos');
const totalGastoEl = document.getElementById('total-gasto');

// ======== CATEGORIAS ========
function atualizarCategorias() {
  categoriaSelect.innerHTML = '';
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoriaSelect.appendChild(opt);
  });

  listaCategorias.innerHTML = '';
  categorias.forEach(cat => {
    const div = document.createElement('div');
    div.textContent = cat;
    const btn = document.createElement('button');
    btn.textContent = 'Apagar';
    btn.onclick = () => {
      categorias = categorias.filter(c => c !== cat);
      produtos = produtos.filter(p => p.categoria !== cat);
      salvarDados();
      atualizarCategorias();
      atualizarProdutos();
    };
    div.appendChild(btn);
    listaCategorias.appendChild(div);
  });
}

// ======== PRODUTOS ========
function atualizarProdutos() {
  listaProdutos.innerHTML = '';
  let total = 0;
  produtos.forEach(p => {
    const div = document.createElement('div');
    const img = document.createElement('img');
    if(p.foto) img.src = p.foto;
    div.textContent = `${p.nome} - R$${p.preco.toFixed(2)} x${p.quantidade} [${p.categoria}]`;
    if(p.foto) div.prepend(img);
    listaProdutos.appendChild(div);
    total += p.preco * p.quantidade;
  });
  totalGastoEl.textContent = total.toFixed(2);
  atualizarGrafico();
}

function salvarDados() {
  localStorage.setItem('categorias', JSON.stringify(categorias));
  localStorage.setItem('produtos', JSON.stringify(produtos));
}

// ======== EVENTOS ========
document.getElementById('adicionar-categoria').onclick = () => {
  const nome = document.getElementById('nova-categoria').value.trim();
  if(nome && !categorias.includes(nome)) {
    categorias.push(nome);
    salvarDados();
    atualizarCategorias();
    document.getElementById('nova-categoria').value = '';
  }
}

document.getElementById('form-produto').onsubmit = (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value;
  const preco = parseFloat(document.getElementById('preco').value);
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const fornecedor = document.getElementById('fornecedor').value;
  const data = document.getElementById('data').value;
  const categoria = document.getElementById('categoria').value;
  const fotoFile = document.getElementById('foto').files[0];

  if(fotoFile){
    const reader = new FileReader();
    reader.onload = () => {
      produtos.push({nome, preco, quantidade, fornecedor, data, categoria, foto: reader.result});
      salvarDados();
      atualizarProdutos();
    };
    reader.readAsDataURL(fotoFile);
  } else {
    produtos.push({nome, preco, quantidade, fornecedor, data, categoria, foto: null});
    salvarDados();
    atualizarProdutos();
  }

  e.target.reset();
}

// ======== GRÁFICO ========
let chart;
function atualizarGrafico() {
  const ctx = document.getElementById('grafico-gastos').getContext('2d');
  const gastoPorCategoria = {};
  produtos.forEach(p => {
    if(!gastoPorCategoria[p.categoria]) gastoPorCategoria[p.categoria] = 0;
    gastoPorCategoria[p.categoria] += p.preco * p.quantidade;
  });
  const data = {
    labels: Object.keys(gastoPorCategoria),
    datasets: [{
      label: 'Gastos por categoria',
      data: Object.values(gastoPorCategoria),
      backgroundColor: ['#0077cc','#ff9900','#33cc33','#cc0033','#9933ff','#00cccc','#cc00cc']
    }]
  };
  if(chart) chart.destroy();
  chart = new Chart(ctx, {type:'pie', data});
}

// ======== CÂMERA + OCR ========
document.getElementById('cadastrar-camera').onclick = async () => {
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    alert('Câmera não suportada neste dispositivo!');
    return;
  }

  const video = document.createElement('video');
  const btnCapturar = document.createElement('button');
  btnCapturar.textContent = 'Capturar Nota';
  document.body.appendChild(video);
  document.body.appendChild(btnCapturar);

  const stream = await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject = stream;
  video.play();

  btnCapturar.onclick = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // OCR Tesseract.js
    const { data: { text } } = await Tesseract.recognize(canvas, 'por', { logger: m => console.log(m) });
    alert('Texto capturado: \n' + text);

    // Exemplo de extração básica (adaptar conforme nota)
    const linhas = text.split('\n').map(l => l.trim()).filter(l => l);
    const nome = linhas[0] || 'Produto OCR';
    const preco = parseFloat(linhas[1]) || 0;
    const quantidade = parseInt(linhas[2]) || 1;
    const fornecedor = linhas[3] || 'Fornecedor OCR';
    const data = new Date().toISOString().slice(0,10);
    const categoria = categorias[0] || 'Sem Categoria';

    produtos.push({nome, preco, quantidade, fornecedor, data, categoria, foto: null});
    salvarDados();
    atualizarProdutos();

    // Fechar câmera
    stream.getTracks().forEach(track => track.stop());
    video.remove();
    btnCapturar.remove();
    canvas.remove();
  };
};

// ======== INICIALIZAÇÃO ========
atualizarCategorias();
atualizarProdutos();
