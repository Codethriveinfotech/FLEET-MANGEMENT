package com.vehicletrackingapp.navigation

import android.util.Log
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.vehicletrackingapp.ui.screens.AdminLoginScreen
import com.vehicletrackingapp.ui.screens.DriverLoginScreen
import com.vehicletrackingapp.ui.screens.SplashScreen
import com.vehicletrackingapp.ui.screens.admin.AdminDashboardScreen
import com.vehicletrackingapp.ui.screens.driver.DriverDashboardScreen

object Routes {
    const val SPLASH = "splash"
    const val DRIVER_LOGIN = "driver_login"
    const val ADMIN_LOGIN = "admin_login"
    const val DRIVER_DASHBOARD = "driver_dashboard"
    const val ADMIN_DASHBOARD = "admin_dashboard"

    fun driverDashboard(driverId: String) = "$DRIVER_DASHBOARD/$driverId"
}

@Composable
fun AppNavGraph() {
    Log.d("AppNavGraph", "NAV_GRAPH_INIT: Rendering NavHost")
    val navController: NavHostController = rememberNavController()

    NavHost(
        navController = navController, 
        startDestination = Routes.SPLASH,
        modifier = androidx.compose.ui.Modifier.background(com.vehicletrackingapp.ui.theme.BrandYellow),
        enterTransition = { fadeIn(animationSpec = tween(400)) + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(400)) },
        exitTransition = { fadeOut(animationSpec = tween(400)) + slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(400)) },
        popEnterTransition = { fadeIn(animationSpec = tween(400)) + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(400)) },
        popExitTransition = { fadeOut(animationSpec = tween(400)) + slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(400)) }
    ) {

        composable(Routes.SPLASH) {
            Log.d("AppNavGraph", "NAV_TO: SplashScreen")
            SplashScreen(onFinished = { nextRoute ->
                Log.d("AppNavGraph", "NAV_FROM: SplashScreen -> $nextRoute")
                navController.navigate(nextRoute) {
                    popUpTo(Routes.SPLASH) { inclusive = true }
                    launchSingleTop = true
                }
            })
        }

        composable(Routes.DRIVER_LOGIN) {
            DriverLoginScreen(
                onLoginSuccess = { driverId ->
                    navController.navigate(Routes.driverDashboard(driverId)) {
                        popUpTo(Routes.DRIVER_LOGIN) { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onGoToSignUp = { },
                onGoToAdminLogin = { 
                    navController.navigate(Routes.ADMIN_LOGIN) {
                        launchSingleTop = true
                    }
                },
                onLanguageChanged = { }
            )
        }

        composable(Routes.ADMIN_LOGIN) {
            AdminLoginScreen(
                onLoginSuccess = {
                    navController.navigate(Routes.ADMIN_DASHBOARD) {
                        popUpTo(Routes.DRIVER_LOGIN) { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "${Routes.DRIVER_DASHBOARD}/{driverId}",
            arguments = listOf(navArgument("driverId") { type = NavType.StringType })
        ) { backStackEntry ->
            val driverId = backStackEntry.arguments?.getString("driverId") ?: ""
            DriverDashboardScreen(
                driverId = driverId,
                onLogout = {
                    navController.navigate(Routes.DRIVER_LOGIN) {
                        popUpTo(0) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Routes.ADMIN_DASHBOARD) {
            AdminDashboardScreen(
                onLogout = {
                    navController.navigate(Routes.DRIVER_LOGIN) {
                        popUpTo(0) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            )
        }
    }
}
