//SPDX-License-Identifier: MIT
//pragma first
pragma solidity ^0.8.8;
//import then
import "./PriceConverter.sol";
//error code then
error FundMe__notOwner(); //nomduContract__error();

//interfaces, Libraries, contract then...
//NatSpec will help us to create a documentation -> https://docs.soliditylang.org/en/v0.8.15/style-guide.html#natspec
/** @title A contract for crowdfunding
 *  @author Patrick Collins
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe{
    //on va déclarer que l'ont veut utiliser les fonctions de la librarie PriceConverter
    //sur les uint256
    //TYPE DECLARATION
    using PriceConverter for uint256;

    //STATE DECLARATION
    address[] private s_funders;
    mapping(address => uint256) private s_adresseToAmountWei;
    //quand la porté n'est déclaré pour une variable la porté est en private..
    //on multiplie par 1e18 pour que le prix de l'eth et AMOUNT_IN_USD est
    //le même nombre de decimal pour pouvoir etre comparable
    //ASRUCE : puisque AMOUNT_IN_USD is constant est ne va pas pouvoir être modifier
    //on peut lui mettre la propriétéé constant.. cela permet de réduire les gas lorsque l'ont va
    //vouloir voir sa valeur avec le getter.. convention d'écriture ->en majuscule et unedrscore
    uint256 public constant AMOUNT_IN_USD = 50 * 1e18;

    //Puisque  i_owner est constant et ne va pouvoir être modifier on veut qu'il soit constant aussi
    //(comme AMOUNT_IN_USD) seulement msg.sender est déclaré dans le constructor donc le mettre constant  ne lui
    //permmettrai pas d'être égale à msg.sender --> donc on utilise immutable.. (comme STATIC en C).
    //on économise des gas comme ca si on veut appeler le getter tout comme AMOUNT_IN_USD
    address public immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner(){
        //require(i_owner == msg.sender, "msg.sender is not the i_owner of this contract !");
        //we can use revert in the new version of the solidity compilatorr in order to do a require but
        //it's requiering less fee
        if(i_owner != msg.sender){ revert FundMe__notOwner();}
        _;
    }


    //constructor
    constructor(address priceFeedAdress){
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAdress);
    }

    //imaginons que quelqu'un envoie des wei à ce contrat sans utiliser fund()
    //l'argent va être stocké dans le contrat mais la personne ne sera pas enrengistrer..
    //on va utiliser les fonctions receive() et fallback()
    //si quelqu'un envoie de l'argent au contrat sans data receive() va être appelé
    //sinon c'est fallback()
    //voir graph en bas de page
    //ces fonctions doivent être external et forcement...payable
    receive() external payable{
        fund();
    }

    fallback() external payable{
        fund();
    }


    /**
    * @notice This function funds this contract
    * @dev This implements price feeds as our library
    */
    function fund() public payable {
        //reverting
        //getConversionRate(msg.value); <-- ancienne manière lorsque getConversionRate(uint 256) était une fonction de FundMe
        require(msg.value.getConversionRate(s_priceFeed) > AMOUNT_IN_USD, "did not send the requiere amount of USD !");
        //requiere va faire en sorte de rendre le gaz qui reste à celui qui n'apas envoyé assez de d'ETH
        //(du gaz a pu etre utilisé en amount du requiere eet ne sera pas rendu)
        //mais aussi annulez tout ce qui s'est passé dans la fonction ex : chamgement de variable ect ...
        s_funders.push(msg.sender);
        s_adresseToAmountWei[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
      for(uint256 founderIndex = 0 ; founderIndex < s_funders.length ; founderIndex++)
      {
          s_adresseToAmountWei[s_funders[founderIndex]] = 0;
      }
      //resting array s_funders
      s_funders = new address[](0);

      //il eciste 3 methodes pour envoyer des ETH d'un contrat a une adresse
      //il faut penser à caster l'adresse msg.sender en payable pour les 3 méthodes
      //transfer : rend directement le gas et renvoi une exeption en cas d'erreur
      /*payable(msg.sender).transfer(address(this).balance);

      //send : il faut en plus de send() un requiere si on veut renvoyer lle gas restant .. (et renvoi un bool)
      //plutot qu'une exeption
      bool sendSucess = payable(msg.sender).send(address(this).balance);
      require(sendSucess, "send Failed ! ");*/

      //call : meilleur manière a voir sur la doc pk, renvoi un bool et un byte contenant certains data
      (bool callSucess,) = payable(msg.sender).call{value : address(this).balance}("");
      require(callSucess, "call Failed ! ");
    }

    function cheaperWithdraw() public onlyOwner {
      //dans l'ancienne méthode on allait faire des lecture dans s_funders pour avoir les address des s_funders
      //dans cette methode on va venir copier s_funders dans la memory et utiliser cette variable dans la memory pour faire les priceFeedAdress
      //cela coute beaucoup moins chere (https://github.com/crytic/evm-opcodes) <- voir 0x54 et 0x53 ce sont les fonctions qui consomment le plus de gas
      address[] memory funders = s_funders;
      // mappings can't be in memory, sorry! c'est pourquoi on ne le fait pas aussi pour s_adresseToAmountWei
      for(uint256 founderIndex = 0 ; founderIndex < s_funders.length ; founderIndex++)
      {
        address funder = funders[founderIndex];
        s_adresseToAmountWei[funder] = 0;
      }
      //resting array s_funders
      s_funders = new address[](0);
      (bool callSucess,) = payable(msg.sender).call{value : address(this).balance}("");
      require(callSucess, "call Failed ! ");
    }

    function getPriceFeed() external view returns(AggregatorV3Interface){
      return s_priceFeed;
    }

    function getFunders(uint256 index) external view returns(address){
      return s_funders[index];
    }

    function getAdresseToAmountWei(address funder) external view returns(uint256){
      return s_adresseToAmountWei[funder];
    }
}

// Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \
    //         yes  no
    //         /     \
    //    receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()

//order of the function
    //constructor
    //receive function (if exists)
    //fallback function (if exists)
    //external
    //public
    //internal
    //private
