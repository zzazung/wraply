//
//  SplashController.swift
//  template
//
//  Created by EO3 on 3/13/26.
//

import UIKit

class SplashController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        Timer.scheduledTimer(timeInterval: 1.5,
                             target: self,
                             selector: #selector(timerCallback),
                             userInfo: nil,
                             repeats: false)
    }
    
    @objc func timerCallback() {
        executeWebViewController()
    }

    private func executeWebViewController() {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let sceneDelegate = windowScene.delegate as? SceneDelegate else {
            return
        }
        
        guard let window = sceneDelegate.window else {
            return
        }
        
        let storyboard = UIStoryboard.init(name: "Main", bundle: nil)
        let controller = storyboard.instantiateViewController(withIdentifier: "Controller.WebView")
//        let navController = EONavigationController(rootViewController: controller)

        window.rootViewController = controller
        window.makeKeyAndVisible()

        UIView.transition(with: window,
                          duration: 0.3,
                          options: .transitionCrossDissolve,
                          animations: nil,
                          completion: nil)
    }
}
