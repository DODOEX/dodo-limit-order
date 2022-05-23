// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../DODOGaslessTrading.sol";
import "./mocks/DODOApproveMock.sol";
import "./mocks/DODOApproveProxyMock.sol";
import "./mocks/DODORouteMock.sol";
import "./mocks/ERC20Mock.sol";

contract DODOGaslessTradingTest is Test {
    DODOGaslessTrading public gaslessTrading;
    address public owner;
    address public insurance;
    address public user;

    DODOApproveMock public dodoApprove;
    DODOApproveProxyMock public dodoApproveProxy;
    DODORouteMock public route;

    ERC20Mock public token1;
    ERC20Mock public token2;

    address public token1TargetAddr = 0xf5a2fE45F4f1308502b1C136b9EF8af136141382;
    address public token2TargetAddr = 0x42997aC9251E5BB0A61F4Ff790E5B991ea07Fd9B; 

    GaslessOrder public order;

    bytes public signature;
    bytes public routeData;
    bytes32 public constant GASLESS_ORDER_TYPEHASH =
        keccak256(
            "Order(address signer,address fromToken,address toToken,uint256 fromAmount,uint256 toAmount,uint256 expiration,uint256 slot)"
        );

    function setUp() public {
        owner = address(1);
        vm.label(owner, "owner");
        insurance = address(2);
        vm.label(insurance, "insurance");
        user = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        vm.label(user, "user");
        signature = hex"5b32f27081458bcbe47c560cf0afc4edf46811bf5f08cf0f5b90eadf878c1a6441e9152b365edc12e0774d5f875a40463d43bcc04774eb4ae3eccf448c8f5f351b";

        dodoApprove = new DODOApproveMock();
        vm.label(address(dodoApprove), "dodoApprove");

        dodoApproveProxy = new DODOApproveProxyMock(address(dodoApprove));
        dodoApprove.setDODOProxy(address(dodoApproveProxy));
        vm.label(address(dodoApproveProxy), "dodoApproveProxy");

        route = new DODORouteMock();
        route.setDODOApproveProxy(address(dodoApproveProxy));
        vm.label(address(route), "route");

        token1 = new ERC20Mock("Token1", "tk1");
        token2 = new ERC20Mock("Token2", "tk2");
        vm.label(address(token1), "token 1");
        vm.label(address(token2), "token 2");

        token1.transfer(user, 100 * 10 ** 18);

        token1.transfer(address(route), 10000 * 10 ** 18);
        token2.transfer(address(route), 10000 * 10 ** 18);

        gaslessTrading = new DODOGaslessTrading(owner, insurance, address(dodoApprove), address(dodoApproveProxy));
        vm.label(address(gaslessTrading), "gaslessTrading");
        dodoApproveProxy.addDODOProxy(address(gaslessTrading));

        order = GaslessOrder({
            signer: user,
            fromToken: token1TargetAddr,
            toToken: token2TargetAddr,
            fromAmount: 100 * 10 ** 18,
            toAmount: 200 * 10 ** 18,
            expiration: 1792883473,
            slot: 1234
        });
    }

    //=============== Helper Functions ===============

    function addAdmin(address addr) public {
        vm.prank(owner);
        gaslessTrading.addAdmin(addr); 
    }

    function approveUseToken1() public {
        vm.prank(user);
        token1.approve(address(dodoApprove), type(uint256).max);
    }

    //============ Test Main Function ============

    function testConstructor() public {
        assertEq(gaslessTrading.owner(), owner);
        assertEq(gaslessTrading._INSURANCE_(), insurance);
        assertEq(gaslessTrading._DODO_APPROVE_(), address(dodoApprove));
        assertEq(gaslessTrading._DODO_APPROVE_PROXY_(), address(dodoApproveProxy));
    }

    function testRFQByNonAdmin() public {
        vm.expectRevert(bytes("ACCESS_DENIED"));
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 5 * 10 ** 18);
    }

    function testRFQWithWrongSignature() public {
        addAdmin(address(this));
        bytes memory wrongSignature = hex"77e2b8cfa52413fcfa315288c2ccec1b426976eeeeaa7db2f61ab0917679132652e3ea3b67b00d8728362e0839d3ddaec0158723afcd291381cb0c0e7745a13b1b";
        vm.expectRevert(bytes("DLOP:INVALID_SIGNATURE"));
        gaslessTrading.matchingRFQByPlatform(order, wrongSignature, routeData, address(route), 5 * 10 ** 18);
    }

    function testRFQWhenOrderExpires() public {
        addAdmin(address(this));
        vm.expectRevert(bytes("DLOP:ORDER_EXPIRED"));
        vm.warp(order.expiration + 1);
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 5 * 10 ** 18);
    }

    function testRFQWhenRouteIsDODOApproveProxy() public {
        addAdmin(address(this));
        approveUseToken1();
        vm.expectRevert(bytes("DLOP:ROUTE_ADDRESS_REJECT"));
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(dodoApproveProxy), 5 * 10 ** 18);
    }

    function testRFQWithEmptyRouteData() public {
        addAdmin(address(this));
        approveUseToken1();
        vm.expectRevert(bytes("DLOP:DODO_ROUTE_FAILED"));
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 5 * 10 ** 18);
    }

    function testRFQWhenRouteIsNotInApproveProxy() public {
        addAdmin(address(this));
        approveUseToken1();
        vm.expectRevert(bytes("DLOP:DODO_ROUTE_FAILED"));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 5 * 10 ** 18);
    }

    function testRFQIfSwapResultIsLargerThanToAmount() public {
        addAdmin(address(this));
        approveUseToken1();
        dodoApproveProxy.addDODOProxy(address(route));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        route.setPrice(3);
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 5 * 10 ** 18);
        assertEq(token2.balanceOf(user), 200 * 10 ** 18); // user receive toAmount
        assertEq(token2.balanceOf(insurance), 100 * 10 ** 18); // insurance receive the extra toToken
    }

    function testRFQIfSwapResultIsEqualToAmount() public {
        addAdmin(address(this));
        approveUseToken1();
        dodoApproveProxy.addDODOProxy(address(route));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        route.setPrice(2);
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 5 * 10 ** 18);
        assertEq(token2.balanceOf(user), 200 * 10 ** 18); // user receive toAmount
        assertEq(token2.balanceOf(insurance), 0);
    }

    function testRFQIfSwapResultIsLessThanToAmount_ExceedMaxCompensation() public {
        addAdmin(address(this));
        approveUseToken1();
        dodoApproveProxy.addDODOProxy(address(route));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        route.setPrice(1);
        vm.expectRevert(bytes("DLOP:COMPENSATION_EXCEED"));
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 99 * 10 ** 18);
        assertEq(token2.balanceOf(user), 0);
        assertEq(token2.balanceOf(insurance), 0);
    }

    function testRFQIfSwapResultIsLessThanToAmount_EnoughCompensation() public {
        addAdmin(address(this));
        approveUseToken1();
        dodoApproveProxy.addDODOProxy(address(route));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        route.setPrice(1);
        token2.transfer(insurance, 100 * 10 ** 18);
        vm.prank(insurance);
        token2.approve(address(dodoApprove), type(uint256).max);
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 100 * 10 ** 18);
        assertEq(token2.balanceOf(user), 200 * 10 ** 18); // user receive toAmount(100) + compensation(100)
        assertEq(token2.balanceOf(insurance), 0); // insurance compensate user toToken(100)
    }

    function testRFQIfSwapResultIsLessThanToAmount_NotEnoughCompensation_NotEnoughFromToken() public {
        addAdmin(address(this));
        approveUseToken1();
        dodoApproveProxy.addDODOProxy(address(route));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        route.setPrice(1);
        vm.prank(insurance);
        token2.approve(address(dodoApprove), type(uint256).max);
        vm.expectRevert(bytes("SafeERC20: low-level call failed"));
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 100 * 10 ** 18);
    }

    function testRFQIfSwapResultIsLessThanToAmount_NotEnoughCompensation_EnoughFromToken() public {
        addAdmin(address(this));
        approveUseToken1();
        dodoApproveProxy.addDODOProxy(address(route));
        routeData = abi.encodeWithSignature("swap(address,address,uint256)", address(token1), address(token2), 100 * 10 ** 18);
        route.setPrice(1);
        vm.prank(insurance);
        token2.approve(address(dodoApprove), type(uint256).max);
        token1.transfer(insurance, 100 * 10 ** 18);
        vm.prank(insurance);
        token1.approve(address(dodoApprove), type(uint256).max);
        gaslessTrading.matchingRFQByPlatform(order, signature, routeData, address(route), 100 * 10 ** 18);
        assertEq(token2.balanceOf(user), 100 * 10 ** 18); // user receive toToken(100), suppose to receive 200
        assertEq(token1.balanceOf(insurance), 50 * 10 ** 18); // insurance give user 50 fromToken (100 / price)
        assertEq(token1.balanceOf(user), 50 * 10 ** 18); // user receive 50 fromToken as compensation
    }

    //============ Test Ownable Functions ============

    function testAddRemoveAdminByOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);

        vm.prank(owner);
        gaslessTrading.addAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), true);

        vm.prank(owner);
        gaslessTrading.removeAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);
    }

    function testAddRemoveAdminByNonOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);

        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        gaslessTrading.addAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);

        vm.prank(owner);
        gaslessTrading.addAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), true);

        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        gaslessTrading.removeAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), true); 
    }

    function testChangeInsuranceByOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._INSURANCE_(), insurance);

        vm.prank(owner);
        gaslessTrading.changeInsurance(user1);
        assertEq(gaslessTrading._INSURANCE_(), user1);
    }

    function testChangeInsuranceByNonOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._INSURANCE_(), insurance);

        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        gaslessTrading.changeInsurance(user1);
        assertEq(gaslessTrading._INSURANCE_(), insurance);
    }
}