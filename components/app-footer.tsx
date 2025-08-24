export function AppFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">PP</span>
            </div>
            <span className="font-semibold">PitchPilot</span>
          </div>

          <p className="text-sm text-muted-foreground text-center md:text-right">
            By using PitchPilot, you agree to optional call recording for training purposes.
            <br className="md:hidden" />
            <span className="md:ml-2">© 2024 PitchPilot. All rights reserved.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
