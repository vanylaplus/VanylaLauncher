/**
 * Script for wheel.ejs - Fortune Wheel Game
 */

let wheelInitialized = false;
let isSpinning = false;
let wheelRotation = 0;
let jetonsImage = null;
let hasRelance = false; // Track if player has a free relance spin

// Load jetons image
const jetonsImg = new Image();
jetonsImg.src = './assets/images/jetons.png';
jetonsImg.onload = () => {
    jetonsImage = jetonsImg;
};
jetonsImg.onerror = () => {
    console.warn('Failed to load jetons.png image');
};

// Rewards with rarity tiers
const wheelRewards = [
    { tokens: 1, rarity: 'common', dropRate: '25%' },           // Index 0
    { tokens: 10, rarity: 'uncommon', dropRate: '12%' },        // Index 1
    { tokens: 30, rarity: 'rare', dropRate: '4%' },             // Index 2
    { tokens: 250, rarity: 'legendary', dropRate: '0.001%' },   // Index 3
    { tokens: -1, rarity: 'respin', dropRate: '15%' },          // Index 4 - RELANCE (séparée)
    { tokens: 2, rarity: 'common', dropRate: '23%' },           // Index 5
    { tokens: 15, rarity: 'rare', dropRate: '10%' },            // Index 6
    { tokens: 50, rarity: 'legendary', dropRate: '2%' },        // Index 7
    { tokens: 0, rarity: 'fail', dropRate: '8.999%' }           // Index 8 - MALCHANCE (séparée)
];

// Update wheel button state based on cooldown
function updateWheelButtonState(spinButton) {
    if (!spinButton) return;
    
    const authUser = ConfigManager.getSelectedAccount();
    if (!authUser || !authUser.uuid) return;
    
    // Check if player has a free relance spin
    const relanceKey = 'wheel_relance_' + authUser.uuid;
    hasRelance = localStorage.getItem(relanceKey) === 'true';
    
    // Check cooldown - allow spin if has relance OR if cooldown is over
    const canSpin = hasRelance || WheelManager_Instance.canSpin(authUser.uuid)
    const timeInfo = WheelManager_Instance.getTimeRemaining(authUser.uuid);
    
    const cooldownMsg = document.getElementById('wheel_cooldownMessage');
    const timeRemainingSpan = document.getElementById('wheel_timeRemaining');
    
    if (canSpin || hasRelance) {
        // Can spin - green button
        spinButton.disabled = false;
        spinButton.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
        spinButton.style.opacity = '1';
        spinButton.style.cursor = 'pointer';
        spinButton.style.boxShadow = '0 12px 32px rgba(46,204,113,0.3), 0 0 20px rgba(46,204,113,0.15)';
        if (cooldownMsg) cooldownMsg.style.display = 'none';
    } else {
        // In cooldown - red button
        spinButton.disabled = true;
        spinButton.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        spinButton.style.opacity = '0.7';
        spinButton.style.cursor = 'not-allowed';
        spinButton.style.boxShadow = '0 12px 32px rgba(231,76,60,0.3), 0 0 20px rgba(231,76,60,0.15)';
        
        // Show cooldown message with time remaining
        if (cooldownMsg && timeRemainingSpan) {
            cooldownMsg.style.display = 'block';
            timeRemainingSpan.textContent = timeInfo.timeString;
        }
    }
}

// Initialize wheel
function initWheel() {
    if(wheelInitialized) return;
    
    const canvas = document.getElementById('wheel_canvas');
    const spinButton = document.getElementById('wheel_spinButton');
    
    if(!canvas || !spinButton) return;
    
    drawWheel(canvas, wheelRotation);
    updateWheelButtonState(spinButton);
    
    spinButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if(!isSpinning) {
            const authUser = ConfigManager.getSelectedAccount();
            const relanceKey = 'wheel_relance_' + authUser.uuid;
            const hasRelance = localStorage.getItem(relanceKey) === 'true';
            
            // Check if can spin (either has relance or cooldown is over)
            if (hasRelance || WheelManager_Instance.canSpin(authUser.uuid)) {
                spinWheel(canvas, spinButton);
            }
        }
    });
    
    // Update button state every second (for countdown)
    setInterval(() => {
        updateWheelButtonState(spinButton);
    }, 1000);
    
    wheelInitialized = true;
}

// Draw the wheel with rotation - Premium Professional Design
function drawWheel(canvas, rotation = 0) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const sliceAngle = (2 * Math.PI) / wheelRewards.length;
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Premium modern color palette - vibrant and rich, matching reward colors
    const colors = [
        { start: '#2ecc71', end: '#27ae60' },      // Vert - 1 jeton (Commun)
        { start: '#00d4ff', end: '#0099cc' },      // Cyan - 10 jetons (Peu Commun)
        { start: '#ffd700', end: '#ffb300' },      // Or - 30 jetons (Très Rare)
        { start: '#ff1744', end: '#c41c3b' },      // Rouge vif - 250 jetons (Mythique)
        { start: '#27ae60', end: '#229954' },      // Vert foncé - 2 jetons (Commun)
        { start: '#0099cc', end: '#006699' },      // Cyan foncé - 15 jetons (Rare)
        { start: '#ff8c00', end: '#ff6600' },      // Orange - 50 jetons (Légendaire)
        { start: '#666666', end: '#333333' },      // Gris - Malchance
        { start: '#9c27b0', end: '#7b2cbf' }       // Violet - Relance
    ];
    
    // Draw outer glow shadow effect
    const shadowGradient = ctx.createRadialGradient(centerX, centerY, radius - 40, centerX, centerY, radius + 40);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 40, 0, 2 * Math.PI);
    ctx.fillStyle = shadowGradient;
    ctx.fill();
    
    // Draw outer golden rim
    const rimGradient = ctx.createLinearGradient(centerX, centerY - radius - 5, centerX, centerY + radius + 5);
    rimGradient.addColorStop(0, '#FFD700');
    rimGradient.addColorStop(0.5, '#FFC700');
    rimGradient.addColorStop(1, '#FFD700');
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = rimGradient;
    ctx.fill();
    
    // Draw each slice with premium styling
    wheelRewards.forEach((reward, index) => {
        const startAngle = (index * sliceAngle) + (rotation * Math.PI / 180);
        const endAngle = startAngle + sliceAngle;
        const midAngle = startAngle + sliceAngle / 2;
        
        // Main slice gradient with perspective
        const sliceGradient = ctx.createLinearGradient(
            centerX + Math.cos(midAngle - sliceAngle/2) * radius * 0.3,
            centerY + Math.sin(midAngle - sliceAngle/2) * radius * 0.3,
            centerX + Math.cos(midAngle + sliceAngle/2) * radius * 0.3,
            centerY + Math.sin(midAngle + sliceAngle/2) * radius * 0.3
        );
        
        const colorPair = colors[index];
        sliceGradient.addColorStop(0, colorPair.start);
        sliceGradient.addColorStop(0.5, colorPair.end);
        sliceGradient.addColorStop(1, colorPair.start);
        
        // Draw main slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = sliceGradient;
        ctx.fill();
        
        // Outer golden border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner white highlight for depth
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 8, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dark inner shadow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Draw reward text - Clean and elegant, no bubbles
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(midAngle);
        
        const textRadius = radius * 0.62;  // Position text in compartment
        
        if(reward.rarity === 'respin') {
            // Draw respin icon emoji
            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            ctx.fillText('⟳', textRadius, 0);
        } else if(reward.tokens === 0) {
            // Draw fail icon emoji
            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            ctx.fillText('✗', textRadius, 0);
        } else {
            // Draw token number - same size for all
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            ctx.fillText(reward.tokens, textRadius - 12, 0);
            
            // Draw jetons image next to number - smaller and well positioned
            if(jetonsImage && jetonsImage.complete) {
                const imgSize = 16;
                const imgX = textRadius + 10;
                const imgY = -imgSize / 2;
                
                ctx.drawImage(jetonsImage, imgX, imgY, imgSize, imgSize);
            }
        }
        
        ctx.restore();
    });
    
    // Draw premium center hub with multi-layer gradient
    const hubGradient1 = ctx.createRadialGradient(centerX - 12, centerY - 12, 0, centerX, centerY, 45);
    hubGradient1.addColorStop(0, '#FFFFFF');
    hubGradient1.addColorStop(0.3, '#FFE55C');
    hubGradient1.addColorStop(0.6, '#FFD700');
    hubGradient1.addColorStop(1, '#DAA520');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
    ctx.fillStyle = hubGradient1;
    ctx.fill();
    
    // Hub outer rim
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Hub inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#F5E6D3';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Premium arrow pointer - TOP of wheel, pointing DOWN - EXTRA LARGE
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 5);  // Point of arrow (pointing down into wheel)
    ctx.lineTo(centerX - 50, centerY - radius - 110);  // Top left - MUCH BIGGER
    ctx.lineTo(centerX + 50, centerY - radius - 110);  // Top right - MUCH BIGGER
    ctx.closePath();
    ctx.fill();
    
    // Arrow border
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Arrow inner highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

// Show success notification - Professional modern styling
function showWinNotification(reward, tokens) {
    const notification = document.createElement('div');
    
    const authUser = ConfigManager.getSelectedAccount();
    
    // Handle cooldown and relance logic
    if(authUser && authUser.uuid && typeof WheelManager_Instance !== 'undefined') {
        const relanceKey = 'wheel_relance_' + authUser.uuid;
        
        if (tokens === -1) {
            // RELANCE: Give free spin, but don't record cooldown yet
            localStorage.setItem(relanceKey, 'true');
        } else {
            // Regular spin: Record cooldown and clear relance if it was used
            WheelManager_Instance.recordSpin(authUser.uuid);
            localStorage.removeItem(relanceKey);
        }
        
        updateWheelButtonState(document.getElementById('wheel_spinButton'));
    }
    
    // Add styles to head if not exists
    if (!document.getElementById('wheelNotifStyles')) {
        const style = document.createElement('style');
        style.id = 'wheelNotifStyles';
        style.textContent = `
            @keyframes wheelNotifIn {
                from { opacity: 0; transform: translate(0, 30px) scale(0.8); }
                to { opacity: 1; transform: translate(0, 0) scale(1); }
            }
            @keyframes wheelNotifOut {
                from { opacity: 1; transform: translate(0, 0) scale(1); }
                to { opacity: 0; transform: translate(0, 30px) scale(0.8); }
            }
            @keyframes wheelNotifIconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
        `;
        document.head.appendChild(style);
    }
    
    if(tokens > 0) {
        // SUCCESS notification
        notification.innerHTML = `
            <div style="display:flex;align-items:center;gap:24px;padding:8px;">
                <div style="font-size:3.5em;line-height:1;animation:wheelNotifIconPulse 1.5s ease-in-out;">🎉</div>
                <div>
                    <div style="font-size:1.3em;font-weight:900;color:#FFD700;letter-spacing:0.8px;text-shadow:0 2px 8px rgba(0,0,0,0.8);">VICTOIRE!</div>
                    <div style="display:flex;align-items:center;gap:8px;font-size:1.15em;font-weight:bold;color:#FFFF00;text-shadow:0 1px 4px rgba(0,0,0,0.8);margin-top:8px;">
                        <img src="./assets/images/jetons.png" alt="jeton" style="height:24px;width:auto;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.8));">
                        <span>+${tokens}</span>
                    </div>
                </div>
            </div>
        `;
        notification.style.cssText = `
            position:fixed;bottom:30px;right:30px;
            background:linear-gradient(135deg,rgba(20,20,20,0.95) 0%,rgba(40,40,40,0.95) 100%);
            border:2px solid rgba(255,215,0,0.6);
            border-radius:16px;
            padding:14px 32px;
            z-index:10000;
            box-shadow:0 16px 48px rgba(255,215,0,0.25),0 0 24px rgba(255,215,0,0.15),inset 0 1px 2px rgba(255,255,255,0.1);
            backdrop-filter:blur(12px);
            animation:wheelNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
            min-width:320px;
            max-width:380px;
        `;
        
        // Add tokens to player's balance
        if(authUser && authUser.uuid && typeof TokenManager_Instance !== 'undefined') {
            const newBalance = TokenManager_Instance.addTokens(authUser.uuid, tokens);
            const balanceElements = document.querySelectorAll('.tokens-balance');
            balanceElements.forEach(elem => {
                elem.textContent = newBalance.toString();
            });
        }
    } else if(tokens === -1) {
        // RESPIN notification
        notification.innerHTML = `
            <div style="display:flex;align-items:center;gap:24px;padding:8px;">
                <div style="font-size:3.5em;line-height:1;animation:wheelNotifIconPulse 1.5s ease-in-out;">⟳</div>
                <div>
                    <div style="font-size:1.3em;font-weight:900;color:#9c27b0;letter-spacing:0.8px;text-shadow:0 2px 8px rgba(0,0,0,0.8);">RELANCE!</div>
                    <div style="font-size:0.9em;color:#e0e0e0;font-weight:600;letter-spacing:0.3px;margin-top:8px;">Vous pouvez rejouer gratuitement</div>
                </div>
            </div>
        `;
        notification.style.cssText = `
            position:fixed;bottom:30px;right:30px;
            background:linear-gradient(135deg,rgba(20,20,20,0.95) 0%,rgba(40,40,40,0.95) 100%);
            border:2px solid rgba(156,39,176,0.6);
            border-radius:16px;
            padding:14px 32px;
            z-index:10000;
            box-shadow:0 16px 48px rgba(156,39,176,0.25),0 0 24px rgba(156,39,176,0.15),inset 0 1px 2px rgba(255,255,255,0.1);
            backdrop-filter:blur(12px);
            animation:wheelNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
            min-width:320px;
            max-width:380px;
        `;
    } else {
        // FAIL notification
        notification.innerHTML = `
            <div style="display:flex;align-items:center;gap:24px;padding:8px;">
                <div style="font-size:3.5em;line-height:1;animation:wheelNotifIconPulse 1.5s ease-in-out;">✗</div>
                <div>
                    <div style="font-size:1.3em;font-weight:900;color:#FF6B6B;letter-spacing:0.8px;text-shadow:0 2px 8px rgba(0,0,0,0.8);">PAS DE CHANCE!</div>
                    <div style="font-size:0.9em;color:#e0e0e0;font-weight:600;letter-spacing:0.3px;margin-top:8px;">Réessayez votre chance!</div>
                </div>
            </div>
        `;
        notification.style.cssText = `
            position:fixed;bottom:30px;right:30px;
            background:linear-gradient(135deg,rgba(20,20,20,0.95) 0%,rgba(40,40,40,0.95) 100%);
            border:2px solid rgba(255,107,107,0.6);
            border-radius:16px;
            padding:14px 32px;
            z-index:10000;
            box-shadow:0 16px 48px rgba(255,107,107,0.25),0 0 24px rgba(255,107,107,0.15),inset 0 1px 2px rgba(255,255,255,0.1);
            backdrop-filter:blur(12px);
            animation:wheelNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
            min-width:320px;
            max-width:380px;
        `;
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'wheelNotifOut 0.5s cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}

// Spin the wheel
function spinWheel(canvas, spinButton) {
    isSpinning = true;
    spinButton.disabled = true;
    
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const randomOffset = Math.random() * 360; // Random final position
    const finalRotation = (spins * 360) + randomOffset;
    
    const startTime = Date.now();
    const duration = 3000; // 3 seconds spin
    
    function animateSpin() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        wheelRotation = finalRotation * easeProgress;
        
        // Redraw wheel with new rotation
        drawWheel(canvas, wheelRotation);
        
        if(progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Spin finished
            isSpinning = false;
            spinButton.disabled = false;
            
            // Detect which item is under the arrow (arrow points DOWN at 270 degrees / -90 degrees)
            const normalizedRotation = finalRotation % 360;
            const sliceAngle = 360 / wheelRewards.length;
            
            // Arrow points DOWN (270 degrees = -90 degrees)
            // The wheel rotates, so we need to find which slice is at the arrow position
            const arrowAngle = 270; // Arrow points DOWN
            let compensatedAngle = (arrowAngle - normalizedRotation) % 360;
            if (compensatedAngle < 0) compensatedAngle = compensatedAngle + 360;
            
            const detectedIndex = Math.floor(compensatedAngle / sliceAngle) % wheelRewards.length;
            
            const detectedReward = wheelRewards[detectedIndex];
            const rewardText = detectedReward.tokens === 0 ? 'Pas de chance!' : `${detectedReward.tokens} Jeton${detectedReward.tokens > 1 ? 's' : ''}`;
            
            // Show success notification with detected reward
            showWinNotification(rewardText, detectedReward.tokens);
            
            // Log the win for tracking
            console.log('Wheel result:', {
                rotation: normalizedRotation,
                arrowAngle: arrowAngle,
                compensatedAngle: compensatedAngle,
                detectedIndex: detectedIndex,
                reward: detectedReward,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    animateSpin();
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the wheel page
    const wheelContainer = document.getElementById('wheelContainer');
    if(wheelContainer && wheelContainer.style.display !== 'none') {
        initWheel();
    }
});

// Also initialize when the wheel container is shown
const wheelContainer = document.getElementById('wheelContainer');
if(wheelContainer) {
    const originalGetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
    const observer = new MutationObserver(() => {
        if(wheelContainer.style.display !== 'none' && !wheelInitialized) {
            initWheel();
        }
    });
    
    observer.observe(wheelContainer, {
        attributes: true,
        attributeFilter: ['style']
    });
}
