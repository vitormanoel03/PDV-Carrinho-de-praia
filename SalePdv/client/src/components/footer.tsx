import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">PDV Praiano</h2>
            <p className="text-gray-400">
              Seu ponto de venda na praia.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Institucional</h3>
            <ul>
              <li><a href="#" className="text-gray-400 hover:text-white">Fale Conosco</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Políticas de Privacidade</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Dúvidas Frequentes</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <p className="text-gray-400">Email: contato@pdvpraiano.com</p>
            <p className="text-gray-400">Telefone: (123) 456-7890</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white"><FaFacebook size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaInstagram size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaTwitter size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaLinkedin size={24} /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} PDV Praiano. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
